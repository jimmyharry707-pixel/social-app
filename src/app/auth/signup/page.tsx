import type { Metadata } from "next";

import { getSupabaseEnv } from "@/lib/supabase/env";

import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Create an account — Gather",
};

export default function SignupPage() {
  return (
    <main className="auth-page">
      <AuthForm configured={getSupabaseEnv() !== null} mode="signup" />
    </main>
  );
}
