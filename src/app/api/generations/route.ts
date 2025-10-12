import { NextRequest, NextResponse, unstable_after } from "next/server";

import { GENERATION_DECADES, GENERATION_PROGRESS_MESSAGES, STORAGE_BUCKET } from "@/lib/constants";
import { getEnv } from "@/lib/env";
import { generateDecadePortrait } from "@/lib/gemini";
import { createErrorId, logError, logInfo, logWarn } from "@/lib/logger";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getPublicUrl, inputImagePath, outputImagePath } from "@/lib/storage";

import type { Decade } from "@/types/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SCOPE = "api/generations";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  const errorId = createErrorId(SCOPE, "POST");

  try {
    const formData = await request.formData();
    const file = formData.get("portrait");

    if (!(file instanceof File)) {
      logWarn(SCOPE, "Invalid request payload", { reason: "portrait missing" });
      return NextResponse.json(
        {
          error: "No portrait file was provided.",
          errorId,
        },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      logWarn(SCOPE, "Invalid file type", { type: file.type });
      return NextResponse.json(
        {
          error: "Only image files are supported.",
          errorId,
        },
        { status: 400 },
      );
    }

    const runId = crypto.randomUUID();
    const originalName = file.name || `portrait-${runId}.png`;
    const storagePath = inputImagePath(runId, originalName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logInfo(SCOPE, "Uploading source portrait", {
      runId,
      size: buffer.byteLength,
      type: file.type,
    });

    const upload = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (upload.error) {
      logError(SCOPE, errorId, upload.error, { runId, storagePath });
      return NextResponse.json(
        {
          error: "Failed to upload to storage.",
          errorId,
        },
        { status: 500 },
      );
    }

    const { error: runInsertError } = await supabase
      .from("generation_runs")
      .insert({
        id: runId,
        input_image_path: storagePath,
        status: "processing",
        completed_images: 0,
        last_progress_message: GENERATION_PROGRESS_MESSAGES[0],
        thumb_image_path: null,
      });

    if (runInsertError) {
      logError(SCOPE, errorId, runInsertError, { runId });
      return NextResponse.json(
        {
          error: "Failed to create generation run.",
          errorId,
        },
        { status: 500 },
      );
    }

    const outputs = GENERATION_DECADES.map((decade) => ({
      id: crypto.randomUUID(),
      run_id: runId,
      decade,
      status: "pending" as const,
    }));

    const { error: outputsInsertError } = await supabase
      .from("generation_outputs")
      .insert(outputs);

    if (outputsInsertError) {
      logError(SCOPE, errorId, outputsInsertError, { runId });
      return NextResponse.json(
        {
          error: "Failed to prepare generation outputs.",
          errorId,
        },
        { status: 500 },
      );
    }

    unstable_after(async () => {
      await runGeneration({
        runId,
        baseImage: arrayBuffer,
        mimeType: file.type,
      });
    });

    return NextResponse.json(
      {
        data: {
          runId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logError(SCOPE, errorId, error);
    return NextResponse.json(
      {
        error: "Unexpected error while starting the generation.",
        errorId,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 24);

  const { data, error, count } = await supabase
    .from("generation_runs")
    .select(
      "id, created_at, thumb_image_path, status, completed_images, generation_outputs (decade, image_path, status)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(Number.isNaN(limit) ? 6 : limit);

  if (error) {
    const errorId = createErrorId(SCOPE, "GET");
    logError(SCOPE, errorId, error);
    return NextResponse.json(
      {
        error: "Failed to load past generations.",
        errorId,
      },
      { status: 500 },
    );
  }

  const baseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const formatted =
    data?.map((run) => ({
      id: run.id,
      created_at: run.created_at,
      status: run.status,
      completed_images: run.completed_images,
      thumb_image_url: run.thumb_image_path
        ? `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${run.thumb_image_path}`
        : null,
      outputs: run.generation_outputs?.map((output) => ({
        decade: output.decade as Decade,
        status: output.status,
        public_url: output.image_path
          ? `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${output.image_path}`
          : null,
      })),
    })) ?? [];

  return NextResponse.json({
    data: formatted,
    count: count ?? 0,
  });
}

type RunGenerationOptions = {
  runId: string;
  baseImage: ArrayBuffer;
  mimeType: string;
};

async function runGeneration(options: RunGenerationOptions) {
  const supabase = getSupabaseServiceRoleClient();
  const { runId, baseImage, mimeType } = options;

  logInfo(SCOPE, "Starting async generation", { runId });

  try {
    for (const [index, decade] of GENERATION_DECADES.entries()) {
      await supabase
        .from("generation_runs")
        .update({
          status: "processing",
          last_progress_message: GENERATION_PROGRESS_MESSAGES[index],
        })
        .eq("id", runId);

      try {
        const generatedBuffer = await generateDecadePortrait({
          baseImage,
          mimeType,
          decade,
        });

        const outputPath = outputImagePath(runId, decade);

        const uploadResult = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(outputPath, generatedBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadResult.error) {
          throw uploadResult.error;
        }

        const publicUrl = getPublicUrl(outputPath);

        await supabase
          .from("generation_outputs")
          .update({
            status: "completed",
            image_path: outputPath,
            error_message: null,
          })
          .eq("run_id", runId)
          .eq("decade", decade);

        await supabase
          .from("generation_runs")
          .update({
            completed_images: index + 1,
            thumb_image_path: index === 0 ? outputPath : undefined,
            last_progress_message:
              GENERATION_PROGRESS_MESSAGES[
                Math.min(index + 1, GENERATION_PROGRESS_MESSAGES.length - 1)
              ],
            status:
              index + 1 === GENERATION_DECADES.length ? "completed" : "processing",
          })
          .eq("id", runId);

        logInfo(SCOPE, "Portrait stored", { runId, decade, publicUrl });
      } catch (error) {
        const errorId = createErrorId(SCOPE, decade);

        logError(SCOPE, errorId, error, { runId, decade });

        await supabase
          .from("generation_outputs")
          .update({
            status: "failed",
            error_message: `Generation failed. errorId=${errorId}`,
          })
          .eq("run_id", runId)
          .eq("decade", decade);

        await supabase
          .from("generation_runs")
          .update({
            status: "failed",
            error_message: `Generation failed for ${decade}. errorId=${errorId}`,
            last_progress_message: `Generation stopped at ${decade}.`,
          })
          .eq("id", runId);

        return;
      }
    }

    await supabase
      .from("generation_runs")
      .update({
        status: "completed",
        last_progress_message:
          GENERATION_PROGRESS_MESSAGES[GENERATION_PROGRESS_MESSAGES.length - 1],
      })
      .eq("id", runId);

    logInfo(SCOPE, "Generation completed", { runId });
  } catch (error) {
    const errorId = createErrorId(SCOPE, "ASYNC");
    logError(SCOPE, errorId, error, { runId });
    await supabase
      .from("generation_runs")
      .update({
        status: "failed",
        error_message: `Unexpected background failure. errorId=${errorId}`,
      })
      .eq("id", runId);
  }
}
