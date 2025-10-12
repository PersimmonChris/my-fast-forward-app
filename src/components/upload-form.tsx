"use client";

import Image from "next/image";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";

import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { GENERATION_PROGRESS_MESSAGES } from "@/lib/constants";
import { createErrorId, logInfo } from "@/lib/logger";
import { cn } from "@/lib/utils";

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
        className={cn(
          "block w-full max-w-xl transition-opacity",
          isPending ? "pointer-events-none opacity-60" : "cursor-pointer",
        )}
      >
        <CardContainer
          containerClassName="!py-0 w-full"
          className="w-full"
        >
          <CardBody
            className={cn(
              "group relative !h-[420px] !w-full max-w-xl overflow-visible rounded-[28px]",
            )}
          >
            <CardItem
              translateZ={60}
              className="relative flex h-full !w-full flex-col overflow-hidden rounded-[28px] border border-white/25 bg-white/10 p-6 shadow-[0_35px_65px_-25px_rgba(15,23,42,0.55)] backdrop-blur-md transition-all duration-300"
            >
              <div className="relative flex-1 overflow-hidden rounded-[20px] border border-white/20 bg-black/40">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Selected portrait preview"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 90vw"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-10 text-center text-white/80">
                    <UploadCloud className="h-11 w-11 text-white/70" aria-hidden="true" />
                    <div className="space-y-1">
                      <span className="block text-base font-medium text-white">
                        Upload your image
                      </span>
                      <span className="block text-xs uppercase tracking-[0.24em] text-white/60">
                        Drop a portrait or click to browse
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-white/70">
                <span>Time Capsule Ready</span>
                <span className="text-white/60">
                  {previewUrl ? "Replace photo" : "Select portrait"}
                </span>
              </div>
            </CardItem>

            <CardItem
              as="span"
              translateZ={95}
              className="pointer-events-none absolute right-6 top-6 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.38em] text-white/70"
            >
              {isPending ? "Queuing" : "Drag & Drop"}
            </CardItem>
          </CardBody>
        </CardContainer>
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
