"use client";

import { RouteError } from "../route-error";

export default function BlogError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} title="We couldn’t load this story." />;
}
