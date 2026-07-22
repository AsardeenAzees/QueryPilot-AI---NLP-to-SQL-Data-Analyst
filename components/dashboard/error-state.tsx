"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ title, message, onRetry, canRetry = true }: { title: string; message: string; onRetry: () => void; canRetry?: boolean }) {
  return (
    <div className="mt-5 flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/80 dark:bg-red-950/45 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between" role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-sm leading-6 opacity-90">{message}</p></div>
      </div>
      {canRetry && <Button type="button" variant="secondary" size="sm" onClick={onRetry} className="shrink-0 border-red-200 bg-white text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"><RefreshCw className="size-4" />Retry</Button>}
    </div>
  );
}
