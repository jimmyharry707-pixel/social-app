"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

export async function signIn(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = getString(formData, "email").toLowerCase();
  const password = getPassword(formData);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return { error: "Enter a valid email and a password of at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "We couldn’t sign you in with those details." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const displayName = getString(formData, "displayName");
  const username = getString(formData, "username").toLowerCase();
  const email = getString(formData, "email").toLowerCase();
  const password = getPassword(formData);

  if (displayName.length < 1 || displayName.length > 60) {
    return { error: "Your name must be between 1 and 60 characters." };
  }
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return { error: "Usernames must be 3–24 characters: lowercase letters, numbers, or underscores." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
      emailRedirectTo: new URL(
        "/auth/callback",
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      ).toString(),
    },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "An account with that email already exists. Try signing in."
          : "We couldn’t create your account. Check your details and try again.",
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  redirect("/auth/login?check-email=1");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Could not sign out. Please try again.");
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function updateProfile(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const displayName = getString(formData, "displayName");
  const username = getString(formData, "username").toLowerCase();
  const bio = getString(formData, "bio");

  if (displayName.length < 1 || displayName.length > 60) {
    return { error: "Your name must be between 1 and 60 characters." };
  }
  if (!/^[a-z0-9_]{3,24}$/.test(username)) {
    return { error: "Usernames must be 3–24 characters: lowercase letters, numbers, or underscores." };
  }
  if (bio.length > 280) {
    return { error: "Your bio must be 280 characters or fewer." };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    return { error: "Please sign in again to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, username, bio })
    .eq("user_id", claimsData.claims.sub);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That username is already taken."
          : "We couldn’t save your profile. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  return { success: "Your profile has been updated." };
}
