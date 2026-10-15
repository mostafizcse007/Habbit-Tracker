export type HabitTemplate = {
  key: string
  name: string
  color: string
  frequency: number[]
  group: "Body" | "Mind" | "Study" | "Daily"
}

export const HABIT_TEMPLATE_GROUPS: HabitTemplate["group"][] = [
  "Body",
  "Mind",
  "Study",
  "Daily",
]

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]
const MWF = [1, 3, 5]

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    key: "water",
    name: "Drink 2 liters of water",
    color: "#3B82F6",
    frequency: EVERY_DAY,
    group: "Body",
  },
  {
    key: "walk",
    name: "Walk for 20 minutes",
    color: "#10B981",
    frequency: EVERY_DAY,
    group: "Body",
  },
  {
    key: "workout",
    name: "Workout",
    color: "#F97316",
    frequency: MWF,
    group: "Body",
  },
  {
    key: "stretch",
    name: "Stretch for 10 minutes",
    color: "#EC4899",
    frequency: EVERY_DAY,
    group: "Body",
  },
  {
    key: "meditate",
    name: "Meditate for 10 minutes",
    color: "#06B6D4",
    frequency: EVERY_DAY,
    group: "Mind",
  },
  {
    key: "journal",
    name: "Write in a journal",
    color: "#EAB308",
    frequency: EVERY_DAY,
    group: "Mind",
  },
  {
    key: "read",
    name: "Read 20 pages",
    color: "#8B5CF6",
    frequency: EVERY_DAY,
    group: "Mind",
  },
  {
    key: "sleep",
    name: "Sleep before 11:30",
    color: "#3B82F6",
    frequency: EVERY_DAY,
    group: "Mind",
  },
  {
    key: "study",
    name: "Study for 1 hour",
    color: "#8B5CF6",
    frequency: WEEKDAYS,
    group: "Study",
  },
  {
    key: "coding",
    name: "Solve 2 coding problems",
    color: "#F97316",
    frequency: EVERY_DAY,
    group: "Study",
  },
  {
    key: "revise",
    name: "Revise today's notes",
    color: "#EF4444",
    frequency: WEEKDAYS,
    group: "Study",
  },
  {
    key: "plan",
    name: "Plan tomorrow",
    color: "#EAB308",
    frequency: EVERY_DAY,
    group: "Daily",
  },
]
