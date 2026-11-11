"use client";

import { RouteError } from "../route-error";

export default function FriendsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} title="Your friends didn’t load." />;
}
