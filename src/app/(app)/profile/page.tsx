import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { ProfileForm } from "@/components/profile/profile-form"
import { PasswordForm } from "@/components/profile/password-form"

export const metadata: Metadata = {
  title: "Profile",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ProfilePage() {
  await connection()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const email = user.email ?? ""
  const emailPrefix = email ? email.split("@")[0] : ""
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    emailPrefix ||
    "User"

  return (
    <div className="pt-7 md:pt-14 pb-14 md:pb-[72px]">
      <div>
        <h1 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.045em] text-foreground">
          Profile
        </h1>
        <p className="mt-[14px] md:mt-[18px] text-[16px] md:text-[19px] leading-[1.4] text-text-soft max-w-[520px]">
          Your details, and the settings the app uses for your days.
        </p>
      </div>

      <div className="mt-10 bg-card border border-border rounded-[14px] overflow-hidden">
        <AvatarUpload
          userId={user.id}
          initialAvatarPath={profile?.avatar_path ?? null}
          name={displayName}
        />
        <ProfileForm profile={profile} email={email} />
        <PasswordForm />
      </div>
    </div>
  )
}
