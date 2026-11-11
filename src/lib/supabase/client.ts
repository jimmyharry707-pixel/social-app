"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

export function createClient() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error("Supabase is not configured. Add the values from .env.example to .env.local.");
  }

  return createBrowserClient(env.url, env.publishableKey);
}
