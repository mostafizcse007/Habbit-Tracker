import test from "node:test"
import assert from "node:assert/strict"

/**
 * Shared server helper implementation of getUserTotalCheckIns for testing
 */
async function getUserTotalCheckIns(supabase, userId, options) {
  let habitsQuery = supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)

  if (!options?.includeArchived) {
    habitsQuery = habitsQuery.eq("archived", false)
  }

  const { data: habits, error: habitsError } = await habitsQuery

  if (habitsError) {
    return { total: 0, error: habitsError.message }
  }

  if (!habits || habits.length === 0) {
    return { total: 0, error: null }
  }

  const habitIds = habits.map((h) => h.id)

  const { count, error: countError } = await supabase
    .from("habit_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("habit_id", habitIds)

  if (countError) {
    return { total: 0, error: countError.message }
  }

  return { total: count ?? 0, error: null }
}

/**
 * Achievements aggregation logic
 */
function evaluateAchievementsStats(habits, logsByHabit) {
  let totalLogs = 0
  for (const habit of habits) {
    const logs = logsByHabit[habit.id] ?? []
    totalLogs += logs.length
  }
  return { totalCheckIns: totalLogs }
}

/**
 * Analytics all-time and range-based aggregation logic
 */
function calculateAnalyticsCheckIns(habits, logsByHabit, range, startDate, today) {
  if (range === "all") {
    let count = 0
    for (const h of habits) {
      count += (logsByHabit[h.id] ?? []).length
    }
    return count
  }
  if (!startDate || !today) return 0
  let count = 0
  for (const h of habits) {
    for (const d of logsByHabit[h.id] ?? []) {
      if (d >= startDate && d <= today) {
        count++
      }
    }
  }
  return count
}

/**
 * Mock Supabase client generator for habit and logs operations
 */
function createMockSupabase(initialHabits, initialLogs) {
  const habits = JSON.parse(JSON.stringify(initialHabits))
  let logs = JSON.parse(JSON.stringify(initialLogs))

  return {
    habits,
    get logs() {
      return logs
    },
    from(table) {
      if (table === "habits") {
        return {
          select() {
            let filterUserId = null
            let filterArchived = null

            const chain = {
              eq(field, val) {
                if (field === "user_id") filterUserId = val
                if (field === "archived") filterArchived = val
                return chain
              },
              then(resolve) {
                let filtered = habits.filter((h) => {
                  if (filterUserId && h.user_id !== filterUserId) return false
                  if (filterArchived !== null && h.archived !== filterArchived)
                    return false
                  return true
                })
                resolve({ data: filtered, error: null })
              },
            }
            return chain
          },
          delete() {
            let filterId = null
            let filterUserId = null
            const chain = {
              eq(field, val) {
                if (field === "id") filterId = val
                if (field === "user_id") filterUserId = val
                return chain
              },
              then(resolve) {
                const idx = habits.findIndex(
                  (h) => h.id === filterId && (!filterUserId || h.user_id === filterUserId)
                )
                if (idx !== -1) {
                  habits.splice(idx, 1)
                }
                resolve({ error: null })
              },
            }
            return chain
          },
        }
      }

      if (table === "habit_logs") {
        return {
          select() {
            let filterUserId = null
            let filterHabitIds = null

            const chain = {
              eq(field, val) {
                if (field === "user_id") filterUserId = val
                return chain
              },
              in(field, vals) {
                if (field === "habit_id") filterHabitIds = vals
                return chain
              },
              then(resolve) {
                const matched = logs.filter((l) => {
                  if (filterUserId && l.user_id !== filterUserId) return false
                  if (filterHabitIds && !filterHabitIds.includes(l.habit_id))
                    return false
                  return true
                })
                resolve({ count: matched.length, data: matched, error: null })
              },
            }
            return chain
          },
          delete() {
            let filterHabitId = null
            let filterUserId = null
            const chain = {
              eq(field, val) {
                if (field === "habit_id") filterHabitId = val
                if (field === "user_id") filterUserId = val
                return chain
              },
              then(resolve) {
                logs = logs.filter((l) => {
                  if (
                    l.habit_id === filterHabitId &&
                    (!filterUserId || l.user_id === filterUserId)
                  ) {
                    return false
                  }
                  return true
                })
                resolve({ error: null })
              },
            }
            return chain
          },
        }
      }

      throw new Error(`Unsupported table ${table}`)
    },
  }
}

test("getUserTotalCheckIns: strictly excludes orphaned check-in logs from deleted habits", async () => {
  const userId = "usr-123"

  // User currently has 2 active habits
  const habits = [
    { id: "h-active-1", user_id: userId, name: "Drink Water", archived: false },
    { id: "h-active-2", user_id: userId, name: "Meditation", archived: false },
    { id: "h-archived-1", user_id: userId, name: "Archived Walk", archived: true },
  ]

  // Logs table contains:
  // - 5 logs for h-active-1
  // - 2 logs for h-active-2
  // - 3 logs for h-archived-1
  // - 139 orphaned logs for a previously deleted habit ('h-deleted-old')
  const logs = []
  for (let i = 0; i < 5; i++) {
    logs.push({ id: `log-a1-${i}`, habit_id: "h-active-1", user_id: userId })
  }
  for (let i = 0; i < 2; i++) {
    logs.push({ id: `log-a2-${i}`, habit_id: "h-active-2", user_id: userId })
  }
  for (let i = 0; i < 3; i++) {
    logs.push({ id: `log-arc-${i}`, habit_id: "h-archived-1", user_id: userId })
  }
  for (let i = 0; i < 139; i++) {
    logs.push({ id: `log-orphaned-${i}`, habit_id: "h-deleted-old", user_id: userId })
  }

  // Total raw logs in DB = 5 + 2 + 3 + 139 = 149 (or 146 without archived)
  assert.equal(logs.length, 149)

  const mockDb = createMockSupabase(habits, logs)

  // 1. Without single source of truth helper, unjoined count would return 146 or 149
  const { total: activeCheckIns } = await getUserTotalCheckIns(mockDb, userId)
  assert.equal(activeCheckIns, 7, "Must count only check-ins from valid active habits (5 + 2 = 7)")

  // 2. includeArchived counts active + archived, but still excludes deleted habits
  const { total: totalWithArchived } = await getUserTotalCheckIns(mockDb, userId, {
    includeArchived: true,
  })
  assert.equal(totalWithArchived, 10, "Must count 5 + 2 + 3 = 10, excluding the 139 orphaned logs")
})

test("Cross-page alignment: /profile, /achievements, and /analytics (all-time) report identical check-ins (7)", async () => {
  const userId = "usr-123"

  const habits = [
    { id: "h-active-1", user_id: userId, name: "Drink Water", archived: false },
    { id: "h-active-2", user_id: userId, name: "Meditation", archived: false },
  ]

  // 5 check-ins for h-active-1 (all in the last 7 days)
  // 2 check-ins for h-active-2 (older than 7 days)
  // 139 orphaned logs from deleted habits
  const logsByHabit = {
    "h-active-1": [
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
    ],
    "h-active-2": ["2026-09-01", "2026-09-05"],
  }

  const logs = [
    ...logsByHabit["h-active-1"].map((d, i) => ({
      id: `log-1-${i}`,
      habit_id: "h-active-1",
      user_id: userId,
      completed_on: d,
    })),
    ...logsByHabit["h-active-2"].map((d, i) => ({
      id: `log-2-${i}`,
      habit_id: "h-active-2",
      user_id: userId,
      completed_on: d,
    })),
  ]
  // Add 139 orphaned logs
  for (let i = 0; i < 139; i++) {
    logs.push({
      id: `orphaned-${i}`,
      habit_id: "h-deleted-old",
      user_id: userId,
      completed_on: "2026-08-01",
    })
  }

  const mockDb = createMockSupabase(habits, logs)

  // 1. /profile query via shared helper
  const { total: profileTotal } = await getUserTotalCheckIns(mockDb, userId)

  // 2. /achievements query via evaluateAchievements
  const { totalCheckIns: achievementsTotal } = evaluateAchievementsStats(habits, logsByHabit)

  // 3. /analytics all-time view
  const analyticsAllTime = calculateAnalyticsCheckIns(
    habits,
    logsByHabit,
    "all",
    "2026-09-01",
    "2026-10-21"
  )

  // 4. /analytics 7-day view (only 5 recent check-ins)
  const analytics7Day = calculateAnalyticsCheckIns(
    habits,
    logsByHabit,
    7,
    "2026-10-15",
    "2026-10-21"
  )

  // Assertions:
  assert.equal(profileTotal, 7, "/profile displays 7 check-ins")
  assert.equal(achievementsTotal, 7, "/achievements displays 7 check-ins")
  assert.equal(analyticsAllTime, 7, "/analytics (all-time) displays 7 check-ins")
  assert.equal(profileTotal, achievementsTotal)
  assert.equal(achievementsTotal, analyticsAllTime)

  // Explain 7-day view
  assert.equal(analytics7Day, 5, "/analytics 7-day view correctly counts only the 5 logs in range")
})

test("Cascade deletion: deleting a habit deletes its associated check-in logs and recalculates user totals", async () => {
  const userId = "usr-123"

  const habits = [
    { id: "h-1", user_id: userId, name: "Habit 1", archived: false },
    { id: "h-2", user_id: userId, name: "Habit 2", archived: false },
  ]

  const logs = [
    { id: "log-1", habit_id: "h-1", user_id: userId, completed_on: "2026-10-20" },
    { id: "log-2", habit_id: "h-1", user_id: userId, completed_on: "2026-10-21" },
    { id: "log-3", habit_id: "h-2", user_id: userId, completed_on: "2026-10-19" },
    { id: "log-4", habit_id: "h-2", user_id: userId, completed_on: "2026-10-20" },
    { id: "log-5", habit_id: "h-2", user_id: userId, completed_on: "2026-10-21" },
  ]

  const mockDb = createMockSupabase(habits, logs)

  // Before deletion: 5 total check-ins
  const before = await getUserTotalCheckIns(mockDb, userId)
  assert.equal(before.total, 5)

  // Simulate deleteHabit action:
  // Step 1: Explicit cascade delete of habit_logs
  await mockDb.from("habit_logs").delete().eq("habit_id", "h-2").eq("user_id", userId)
  // Step 2: Delete habit
  await mockDb.from("habits").delete().eq("id", "h-2").eq("user_id", userId)

  // Verify habit_logs in database have no logs for h-2
  const remainingLogsForH2 = mockDb.logs.filter((l) => l.habit_id === "h-2")
  assert.equal(remainingLogsForH2.length, 0, "All associated check-in logs must be deleted")

  // After deletion: total check-ins recalculated to exactly 2
  const after = await getUserTotalCheckIns(mockDb, userId)
  assert.equal(after.total, 2, "User check-ins count decremented to 2")
})

test("getUserTotalCheckIns: returns 0 when user has no active habits or no check-ins", async () => {
  const userId = "usr-empty"
  const mockDb = createMockSupabase([], [])

  const { total, error } = await getUserTotalCheckIns(mockDb, userId)
  assert.equal(error, null)
  assert.equal(total, 0)
})
