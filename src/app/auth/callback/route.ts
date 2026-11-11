import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const env = getSupabaseEnv();

  if (!env) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=confirmation", request.url));
}
