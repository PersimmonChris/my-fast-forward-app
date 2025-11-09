"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download as DownloadIcon, Maximize2 } from "lucide-react";

import {
  GENERATION_DECADES,
  GENERATION_PROGRESS_MESSAGES,
} from "@/lib/constants";
import { createErrorId } from "@/lib/logger";
import type { GenerationRun } from "@/types/generation";

import { PolaroidFrame } from "./polaroid-frame";

type ResultsViewerProps = {
  initialRun: GenerationRun;
};

type ApiRun = {
  id: string;
  created_at: string;
  status: GenerationRun["status"];
  completed_images: number;
  error_message: string | null;
  last_progress_message: string | null;
  outputs: {
    id: string;
    decade: string;
    status: string;
    error_message: string | null;
    created_at: string;
    public_url: string | null;
    image_path: string | null;
  }[];
};

export function ResultsViewer({ initialRun }: ResultsViewerProps) {
  const [run, setRun] = useState<GenerationRun>(initialRun);
  const [error, setError] = useState<string | null>(null);
  const runId = initialRun.id;

  const isFinished = run.status === "completed" || run.status === "failed";

  useEffect(() => {
    if (isFinished) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generations/${runId}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          const errorId = createErrorId("results", "FETCH");
          setError(`Failed to refresh progress. errorId=${errorId}`);
          return;
        }
        const payload = (await response.json()) as { data: ApiRun };
        if (payload?.data) {
          setRun((previous) => ({
            ...previous,
            status: payload.data.status,
            completed_images: payload.data.completed_images,
            error_message: payload.data.error_message,
            last_progress_message: payload.data.last_progress_message,
            outputs: payload.data.outputs.map((output) => ({
              id: output.id,
              run_id: runId,
              created_at: output.created_at,
              decade: output.decade as GenerationRun["outputs"][number]["decade"],
              status: output.status as GenerationRun["outputs"][number]["status"],
              error_message: output.error_message,
              image_path: output.image_path,
              public_url: output.public_url,
            })),
          }));
        }
      } catch (fetchError) {
        console.error(fetchError);
        const errorId = createErrorId("results", "NET");
        setError(`Network error while polling. errorId=${errorId}`);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isFinished, runId]);

  const progressMessage = useMemo(() => {
    if (run.status === "completed") {
      return GENERATION_PROGRESS_MESSAGES[3];
    }
    if (run.status === "failed") {
      return (
        run.error_message ??
        "Something went wrong while we were generating your portraits."
      );
    }
    return (
      run.last_progress_message ??
      GENERATION_PROGRESS_MESSAGES[Math.min(run.completed_images, 2)]
    );
  }, [run]);

  return (
    <section className="w-full max-w-6xl space-y-10">
      <header className="space-y-4 text-center">
        <span className="text-xs uppercase tracking-[0.38em] text-muted">
          A Time Capsule
        </span>
        <h1 className="text-4xl font-light uppercase tracking-[0.18em] sm:text-5xl">
          So how do you look?
        </h1>
        <p className="text-sm text-muted sm:text-base">{progressMessage}</p>
      </header>

      {error ? (
        <div className="rounded-[18px] border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {GENERATION_DECADES.map((decade) => {
          const output = run.outputs.find(
            (item) => item.decade === decade,
          );
          const status = output?.status ?? "pending";
          const message =
            status === "pending"
              ? `Generating your ${decade} look…`
              : status === "failed"
                ? output?.error_message ?? "Generation failed."
                : "Ready to view.";

          return (
            <PolaroidFrame
              key={decade}
              label={decade}
              imageUrl={output?.public_url ?? undefined}
              placeholder={<span className="text-xs">{message}</span>}
              hover
              className="h-full"
              actions={
                output?.public_url ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={output.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-black hover:text-white"
                    >
                      <Maximize2 className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Full view</span>
                    </a>
                    <a
                      href={output.public_url}
                      download={`time-capsule-${run.id}-${decade}.png`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-sm transition hover:bg-black hover:text-white"
                    >
                      <DownloadIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Download</span>
                    </a>
                  </div>
                ) : (
                  <span className="text-[11px] uppercase tracking-[0.3em] text-muted">
                    {status === "pending" ? "Processing" : "Unavailable"}
                  </span>
                )
              }
            />
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 pt-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border-2 border-white px-12 py-3 text-sm font-semibold uppercase tracking-[0.26em] text-white transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Back to Generate
        </Link>
      </div>
    </section>
  );
}
