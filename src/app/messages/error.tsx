"use client";

import { RouteError } from "../route-error";

export default function MessagesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      homeHref="/messages"
      retry={retry}
      title="We couldn’t load your messages."
    />
  );
}
