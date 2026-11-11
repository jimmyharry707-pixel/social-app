import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "../auth-form";
import { getSupabaseEnv } from "@/lib/supabase/env";

type LoginSearchParams = PageProps<"/auth/login">["searchParams"];

export const metadata: Metadata = {
  title: "Sign in — Gather",
};

export default function LoginPage(props: PageProps<"/auth/login">) {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-card auth-card-loading" />}>
        <LoginContent searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginContent({ searchParams }: { searchParams: LoginSearchParams }) {
  const { ["check-email"]: checkEmail, error } = await searchParams;

  return (
    <AuthForm
      checkEmail={checkEmail === "1"}
      configured={getSupabaseEnv() !== null}
      confirmationError={error === "confirmation"}
      mode="login"
    />
  );
}
