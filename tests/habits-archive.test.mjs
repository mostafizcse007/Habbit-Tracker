import test from "node:test"
import assert from "node:assert/strict"

function partitionHabits(habits) {
  const active = habits
    .filter((h) => !h.archived)
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
    )
  const archived = habits
    .filter((h) => h.archived)
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
    )
  return { active, archived }
}

function optimisticArchive(habits, habitId) {
  return habits.map((h) => (h.id === habitId ? { ...h, archived: true } : h))
}

function optimisticUnarchive(habits, habitId) {
  return habits.map((h) => (h.id === habitId ? { ...h, archived: false } : h))
}

function optimisticDelete(habits, habitId) {
  return habits.filter((h) => h.id !== habitId)
}

test("partitionHabits: correctly separates active and archived habits with accurate counts", () => {
  const initialHabits = [
    {
      id: "1",
      name: "Drink Water",
      color: "#3B82F6",
      frequency: [0, 1, 2, 3, 4, 5, 6],
      sort_order: 1,
      archived: false,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Morning Run",
      color: "#10B981",
      frequency: [1, 3, 5],
      sort_order: 2,
      archived: true,
      created_at: "2026-01-02T00:00:00Z",
    },
    {
      id: "3",
      name: "Read Book",
      color: "#8B5CF6",
      frequency: [0, 6],
      sort_order: 3,
      archived: false,
      created_at: "2026-01-03T00:00:00Z",
    },
  ]

  const { active, archived } = partitionHabits(initialHabits)

  assert.equal(active.length, 2)
  assert.equal(archived.length, 1)
  assert.equal(active[0].id, "1")
  assert.equal(active[1].id, "3")
  assert.equal(archived[0].id, "2")
})

test("optimisticArchive: moves habit from active to archived immediately without reload", () => {
  const initialHabits = [
    {
      id: "h-1",
      name: "Meditation",
      color: "#F59E0B",
      frequency: [0, 1, 2, 3, 4, 5, 6],
      sort_order: 1,
      archived: false,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "h-2",
      name: "Coding Practice",
      color: "#6366F1",
      frequency: [1, 2, 3, 4, 5],
      sort_order: 2,
      archived: false,
      created_at: "2026-01-02T00:00:00Z",
    },
  ]

  const before = partitionHabits(initialHabits)
  assert.equal(before.active.length, 2)
  assert.equal(before.archived.length, 0)

  // User clicks Archive on Meditation
  const afterArchive = optimisticArchive(initialHabits, "h-1")
  const after = partitionHabits(afterArchive)

  assert.equal(after.active.length, 1)
  assert.equal(after.archived.length, 1)
  assert.equal(after.active[0].name, "Coding Practice")
  assert.equal(after.archived[0].name, "Meditation")
})

test("optimisticUnarchive: restores habit from archived back to active immediately", () => {
  const initialHabits = [
    {
      id: "h-1",
      name: "Meditation",
      color: "#F59E0B",
      frequency: [0, 1, 2, 3, 4, 5, 6],
      sort_order: 1,
      archived: true,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "h-2",
      name: "Coding Practice",
      color: "#6366F1",
      frequency: [1, 2, 3, 4, 5],
      sort_order: 2,
      archived: false,
      created_at: "2026-01-02T00:00:00Z",
    },
  ]

  const before = partitionHabits(initialHabits)
  assert.equal(before.active.length, 1)
  assert.equal(before.archived.length, 1)

  // User clicks Restore on Meditation
  const afterUnarchive = optimisticUnarchive(initialHabits, "h-1")
  const after = partitionHabits(afterUnarchive)

  assert.equal(after.active.length, 2)
  assert.equal(after.archived.length, 0)
  assert.equal(after.active[0].name, "Meditation")
  assert.equal(after.active[1].name, "Coding Practice")
})

test("optimisticDelete: deletes habit and removes it from list and counts", () => {
  const initialHabits = [
    {
      id: "h-1",
      name: "Meditation",
      color: "#F59E0B",
      frequency: [0, 1, 2, 3, 4, 5, 6],
      sort_order: 1,
      archived: true,
      created_at: "2026-01-01T00:00:00Z",
    },
  ]

  const afterDelete = optimisticDelete(initialHabits, "h-1")
  const after = partitionHabits(afterDelete)

  assert.equal(after.active.length, 0)
  assert.equal(after.archived.length, 0)
})
