"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <h2>Something went wrong!</h2>
      <Button onClick={() => unstable_retry()}>
        {"Try again (`unstable_retry()`)"}
      </Button>
    </>
  );
}
