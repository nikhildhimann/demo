"use client";

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-center px-4">
      <h1 className="text-4xl font-bold text-destructive">Something went wrong!</h1>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. We have been notified and are working on it.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}
