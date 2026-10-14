import type { Database } from "./database"

export type Habit = Database["public"]["Tables"]["habits"]["Row"]
export type HabitInsert = Database["public"]["Tables"]["habits"]["Insert"]
export type HabitUpdate = Database["public"]["Tables"]["habits"]["Update"]
export type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"]
export type HabitLogInsert = Database["public"]["Tables"]["habit_logs"]["Insert"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type UserAchievement =
  Database["public"]["Tables"]["user_achievements"]["Row"]
export type UserAchievementInsert =
  Database["public"]["Tables"]["user_achievements"]["Insert"]

export type { Database }
