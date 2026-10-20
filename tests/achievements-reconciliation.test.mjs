import test from "node:test"
import assert from "node:assert/strict"

/**
 * Reconciles user achievements logic against current active habits and verified check-in history.
 */
async function reconcileUserAchievements(supabase, userId, habits, logsByHabit) {
  // 1. Evaluate achievements based on active habits & logs
  let totalCheckIns = 0
  for (const h of habits) {
    totalCheckIns += (logsByHabit[h.id] ?? []).length
  }

  const earnedKeys = new Set()
  if (totalCheckIns >= 1) earnedKeys.add("first_checkin")
  if (totalCheckIns >= 25) earnedKeys.add("checkins_25")
  if (totalCheckIns >= 100) earnedKeys.add("checkins_100")
  if (totalCheckIns >= 500) earnedKeys.add("checkins_500")

  let longestStreak = 0
  for (const h of habits) {
    const logs = logsByHabit[h.id] ?? []
    // contiguous days
    let run = 0
    let maxRun = 0
    const sorted = [...logs].sort()
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = new Date(sorted[i - 1])
        const cur = new Date(sorted[i])
        const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000)
        if (diff === 1) {
          run++
        } else if (diff > 1) {
          run = 1
        }
      } else {
        run = 1
      }
      if (run > maxRun) maxRun = run
    }
    if (maxRun > longestStreak) longestStreak = maxRun
  }

  if (longestStreak >= 7) earnedKeys.add("streak_7")
  if (longestStreak >= 30) earnedKeys.add("streak_30")
  if (longestStreak >= 100) earnedKeys.add("streak_100")

  // 2. Fetch existing rows from mock database
  const { data: existingRows } = await supabase
    .from("user_achievements")
    .select()
    .eq("user_id", userId)

  const existingMap = new Map((existingRows ?? []).map((r) => [r.key, r.unlocked_at]))
  const keysToInsert = Array.from(earnedKeys).filter((k) => !existingMap.has(k))
  const keysToDelete = (existingRows ?? [])
    .filter((r) => !earnedKeys.has(r.key))
    .map((r) => r.key)

  // 3. Prune/revoke stale badge records
  if (keysToDelete.length > 0) {
    await supabase
      .from("user_achievements")
      .delete()
      .eq("user_id", userId)
      .in("key", keysToDelete)
  }

  // 4. Insert newly earned badge records
  const newlyUnlocked = []
  const newlyUnlockedRows = []
  for (const key of keysToInsert) {
    const { data } = await supabase
      .from("user_achievements")
      .insert({ key, user_id: userId, unlocked_at: new Date().toISOString() })
    if (data) {
      newlyUnlocked.push(data.key)
      newlyUnlockedRows.push(data)
    }
  }

  // 5. Assemble validated unlocked badges
  const unlocked = []
  for (const [key, unlocked_at] of existingMap.entries()) {
    if (earnedKeys.has(key)) {
      unlocked.push({ key, unlocked_at })
    }
  }
  for (const row of newlyUnlockedRows) {
    unlocked.push(row)
  }

  return {
    success: true,
    newlyUnlocked,
    revoked: keysToDelete,
    unlocked,
    stats: {
      totalCheckIns,
      longestStreak,
    },
  }
}

/**
 * Filter badge presentation logic in AchievementsView
 */
function computeBadgePresentation(achievementsDefs, unlockedMap, stats) {
  const isBadgeEligible = (key) => {
    if (!stats) return true
    if (stats.totalCheckIns === 0) return false
    if (key === "first_checkin") return stats.totalCheckIns >= 1
    if (key === "checkins_25") return stats.totalCheckIns >= 25
    if (key === "checkins_100") return stats.totalCheckIns >= 100
    if (key === "checkins_500") return stats.totalCheckIns >= 500
    if (key === "streak_7") return stats.longestStreak >= 7
    if (key === "streak_30") return stats.longestStreak >= 30
    if (key === "streak_100") return stats.longestStreak >= 100
    return true
  }

  const getProgress = (key) => {
    if (!stats) return null
    if (key === "checkins_25") {
      const current = Math.min(stats.totalCheckIns, 25)
      return { current, max: 25, text: `${current} of 25`, percent: Math.round((current / 25) * 100) }
    }
    if (key === "checkins_100") {
      const current = Math.min(stats.totalCheckIns, 100)
      return { current, max: 100, text: `${current} of 100`, percent: Math.round((current / 100) * 100) }
    }
    if (key === "checkins_500") {
      const current = Math.min(stats.totalCheckIns, 500)
      return { current, max: 500, text: `${current} of 500`, percent: Math.round((current / 500) * 100) }
    }
    if (key === "streak_7") {
      const current = Math.min(stats.longestStreak, 7)
      return { current, max: 7, text: `${current} of 7 days`, percent: Math.round((current / 7) * 100) }
    }
    if (key === "streak_30") {
      const current = Math.min(stats.longestStreak, 30)
      return { current, max: 30, text: `${current} of 30 days`, percent: Math.round((current / 30) * 100) }
    }
    if (key === "streak_100") {
      const current = Math.min(stats.longestStreak, 100)
      return { current, max: 100, text: `${current} of 100 days`, percent: Math.round((current / 100) * 100) }
    }
    return null
  }

  const list = []
  for (const def of achievementsDefs) {
    const unlockedAt = unlockedMap.get(def.key)
    const isUnlocked = Boolean(unlockedAt && isBadgeEligible(def.key))
    const progress = !isUnlocked ? getProgress(def.key) : null
    list.push({
      key: def.key,
      isUnlocked,
      unlocked_at: isUnlocked ? unlockedAt : "",
      progress,
    })
  }

  return list
}

function createMockAchievementsDb(initialRows) {
  let rows = JSON.parse(JSON.stringify(initialRows))

  return {
    get rows() {
      return rows
    },
    from(table) {
      if (table !== "user_achievements") throw new Error(`Unexpected table ${table}`)
      return {
        select() {
          let filterUserId = null
          const chain = {
            eq(col, val) {
              if (col === "user_id") filterUserId = val
              return chain
            },
            then(resolve) {
              const res = rows.filter((r) => !filterUserId || r.user_id === filterUserId)
              resolve({ data: res, error: null })
            },
          }
          return chain
        },
        delete() {
          let filterUserId = null
          let filterInKeys = null
          const chain = {
            eq(col, val) {
              if (col === "user_id") filterUserId = val
              return chain
            },
            in(col, vals) {
              if (col === "key") filterInKeys = vals
              return chain
            },
            then(resolve) {
              rows = rows.filter((r) => {
                if (filterUserId && r.user_id !== filterUserId) return true
                if (filterInKeys && filterInKeys.includes(r.key)) return false
                return true
              })
              resolve({ error: null })
            },
          }
          return chain
        },
        insert(payload) {
          return {
            select() {
              return {
                single() {
                  const inserted = {
                    ...payload,
                    unlocked_at: payload.unlocked_at || "2026-10-21T03:00:00Z",
                  }
                  rows.push(inserted)
                  return Promise.resolve({ data: inserted, error: null })
                },
              }
            },
            then(resolve) {
              const inserted = {
                ...payload,
                unlocked_at: payload.unlocked_at || "2026-10-21T03:00:00Z",
              }
              rows.push(inserted)
              resolve({ data: inserted, error: null })
            },
          }
        },
      }
    },
  }
}

test("reconcileUserAchievements: revokes stale seeded badges from 14 Oct 2026 when metrics are below threshold", async () => {
  const userId = "user-abc"

  // User currently has 2 active habits with 7 total check-ins and a 6-day streak
  const habits = [
    { id: "h1", user_id: userId, name: "Habit 1" },
    { id: "h2", user_id: userId, name: "Habit 2" },
  ]
  const logsByHabit = {
    h1: [
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21", // 6 days in a row
    ],
    h2: ["2026-10-01"], // 1 check-in
  }
  // Total = 6 + 1 = 7 check-ins. Longest streak = 6 days.

  // Database currently has stale records seeded on 14 Oct 2026
  const initialDbRows = [
    { user_id: userId, key: "first_checkin", unlocked_at: "2026-10-14T10:00:00Z" },
    { user_id: userId, key: "checkins_25", unlocked_at: "2026-10-14T10:00:00Z" },
    { user_id: userId, key: "checkins_100", unlocked_at: "2026-10-14T10:00:00Z" },
    { user_id: userId, key: "streak_7", unlocked_at: "2026-10-14T10:00:00Z" },
  ]

  const mockDb = createMockAchievementsDb(initialDbRows)

  const result = await reconcileUserAchievements(mockDb, userId, habits, logsByHabit, "2026-10-21")

  // Check stats
  assert.equal(result.stats.totalCheckIns, 7)
  assert.equal(result.stats.longestStreak, 6)

  // Check revoked badges
  assert.deepEqual(result.revoked.sort(), ["checkins_100", "checkins_25", "streak_7"].sort())

  // Check database after reconciliation: only first_checkin remains
  assert.equal(mockDb.rows.length, 1)
  assert.equal(mockDb.rows[0].key, "first_checkin")
  assert.equal(mockDb.rows[0].unlocked_at, "2026-10-14T10:00:00Z", "Legitimate unlock date is preserved")

  // Check unlocked list returned
  assert.equal(result.unlocked.length, 1)
  assert.equal(result.unlocked[0].key, "first_checkin")
})

test("Badge presentation: progress bars and unlock status never contradict each other", () => {
  const defs = [
    { key: "first_checkin", title: "First check-in" },
    { key: "checkins_25", title: "25 check-ins" },
    { key: "checkins_100", title: "100 check-ins" },
    { key: "checkins_500", title: "500 check-ins" },
    { key: "streak_7", title: "One week" },
    { key: "streak_30", title: "30-day chain" },
  ]

  // Stats: 7 check-ins, 6 day streak
  const stats = { totalCheckIns: 7, longestStreak: 6 }

  // Even if an unpruned map had stale entries:
  const staleMap = new Map([
    ["first_checkin", "2026-10-14T10:00:00Z"],
    ["checkins_25", "2026-10-14T10:00:00Z"],
    ["checkins_100", "2026-10-14T10:00:00Z"],
    ["streak_7", "2026-10-14T10:00:00Z"],
  ])

  const list = computeBadgePresentation(defs, staleMap, stats)

  const firstCheckin = list.find((b) => b.key === "first_checkin")
  assert.equal(firstCheckin.isUnlocked, true, "1 >= 1 check-in is unlocked")

  const c25 = list.find((b) => b.key === "checkins_25")
  assert.equal(c25.isUnlocked, false, "25 check-ins must be locked when user has 7")
  assert.equal(c25.progress.text, "7 of 25")
  assert.equal(c25.progress.percent, 28)

  const c100 = list.find((b) => b.key === "checkins_100")
  assert.equal(c100.isUnlocked, false, "100 check-ins must be locked when user has 7")
  assert.equal(c100.progress.text, "7 of 100")
  assert.equal(c100.progress.percent, 7)

  const c500 = list.find((b) => b.key === "checkins_500")
  assert.equal(c500.isUnlocked, false)
  assert.equal(c500.progress.text, "7 of 500")
  assert.equal(c500.progress.percent, 1)

  const s7 = list.find((b) => b.key === "streak_7")
  assert.equal(s7.isUnlocked, false, "7 day streak must be locked when user has 6 days")
  assert.equal(s7.progress.text, "6 of 7 days")
  assert.equal(s7.progress.percent, 86)

  const s30 = list.find((b) => b.key === "streak_30")
  assert.equal(s30.isUnlocked, false)
  assert.equal(s30.progress.text, "6 of 30 days")
  assert.equal(s30.progress.percent, 20)
})

test("reconcileUserAchievements: deleting habit revokes badges whose thresholds are no longer met", async () => {
  const userId = "user-delete-test"

  // Habit 1 has 5 logs, Habit 2 has 20 logs -> Total 25 logs (earns checkins_25)
  const logsBefore = {
    h1: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"],
    h2: Array.from({ length: 20 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`),
  }

  const mockDb = createMockAchievementsDb([
    { user_id: userId, key: "first_checkin", unlocked_at: "2026-10-01T00:00:00Z" },
    { user_id: userId, key: "checkins_25", unlocked_at: "2026-10-05T00:00:00Z" },
  ])

  // Habit 2 is deleted -> only Habit 1 remains (5 check-ins)
  const habitsAfter = [{ id: "h1", user_id: userId, name: "Habit 1" }]
  const logsAfter = {
    h1: logsBefore.h1,
  }

  const result = await reconcileUserAchievements(mockDb, userId, habitsAfter, logsAfter, "2026-10-21")

  assert.equal(result.stats.totalCheckIns, 5)
  assert.deepEqual(result.revoked, ["checkins_25"])
  assert.equal(mockDb.rows.length, 1)
  assert.equal(mockDb.rows[0].key, "first_checkin")
})
