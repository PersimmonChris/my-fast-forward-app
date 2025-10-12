"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

import { GENERATION_PROGRESS_MESSAGES } from "@/lib/constants";
import { createErrorId, logInfo } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { PolaroidFrame } from "./polaroid-frame";

type UploadFormProps = {
  pastRunCount: number;
};

export function UploadForm({ pastRunCount }: UploadFormProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setProgressMessage(null);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const resetState = useCallback(() => {
    setPreviewUrl(null);
    setProgressMessage(null);
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const file = formData.get("portrait") as File | null;

      if (!file || file.size === 0) {
        setError("Add a portrait before generating.");
        return;
      }

      setError(null);
      setProgressMessage(GENERATION_PROGRESS_MESSAGES[0]);

      startTransition(async () => {
        try {
          const response = await fetch("/api/generations", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            const message =
              payload?.error ??
              "We couldn't start the generation. Please try again.";
            const id = payload?.errorId;
            setError(id ? `${message} (errorId=${id})` : message);
            return;
          }

          const payload = (await response.json()) as {
            data?: { runId: string };
          };

          const runId = payload.data?.runId;

          if (!runId) {
            const errorId = createErrorId("upload-form", "NO-RUN");
            setError(`Generation started but missing run id. errorId=${errorId}`);
            return;
          }

          logInfo("upload-form", "Redirecting to results", { runId });
          router.push(`/results/${runId}`);
          resetState();
        } catch (err) {
          const errorId = createErrorId("upload-form", "NETWORK");
          setError(`Network error. Please try again. errorId=${errorId}`);
          console.error(err);
        }
      });
    },
    [resetState, router, startTransition],
  );

  const fieldHint = useMemo(() => {
    if (error) {
      return error;
    }
    if (progressMessage) {
      return progressMessage;
    }
    return `You have created ${pastRunCount} time capsule${
      pastRunCount === 1 ? "" : "s"
    }.`;
  }, [error, pastRunCount, progressMessage]);

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl"
      aria-describedby="upload-status"
    >
      <input
        id="portrait"
        name="portrait"
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        disabled={isPending}
      />

      <label
        htmlFor="portrait"
        className={cn("block w-full", isPending ? "pointer-events-none opacity-60" : "cursor-pointer")}
      >
        <PolaroidFrame
          imageUrl={previewUrl ?? undefined}
          placeholder={
            <div className="flex flex-col items-center gap-3 text-center">
              <UploadCloud className="h-10 w-10 text-black/50" aria-hidden="true" />
              <div className="space-y-1">
                <span className="block text-base font-medium text-black">
                  Upload your image
                </span>
                <span className="block text-xs text-muted">
                  Drop a portrait or click to browse
                </span>
              </div>
            </div>
          }
          className={cn("w-full", isPending && "pointer-events-none")}
          footer={null}
        />
      </label>

      <div className="mt-6 flex flex-col gap-4">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-white/70 bg-white/5 px-8 py-3 text-sm font-medium uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black focus:outline-none",
            isPending ? "cursor-progress opacity-60" : "focus-ring",
          )}
        >
          {isPending ? "Queuing…" : "Generate"}
        </button>

        <p
          id="upload-status"
          className={cn(
            "text-sm text-muted",
            error ? "text-red-400" : "text-muted",
          )}
        >
          {fieldHint}
        </p>
      </div>
    </form>
  );
}
