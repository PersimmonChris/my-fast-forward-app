import { NextRequest, NextResponse } from "next/server";

import { GENERATION_PROGRESS_MESSAGES, STORAGE_BUCKET } from "@/lib/constants";
import { getEnv } from "@/lib/env";
import { createErrorId, logError, logInfo } from "@/lib/logger";
import {
  getSupabaseServiceRoleClient,
  type Database,
} from "@/lib/supabase-server";

const SCOPE = "api/generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerationRunRecord =
  Database["public"]["Tables"]["generation_runs"]["Row"] & {
    generation_outputs:
      | Array<
          Pick<
            Database["public"]["Tables"]["generation_outputs"]["Row"],
            | "id"
            | "created_at"
            | "decade"
            | "status"
            | "error_message"
            | "image_path"
          >
        >
      | null;
  };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseServiceRoleClient();
  const { id: runId } = await context.params;
  const errorId = createErrorId(SCOPE, "GET");

  try {
    const { data, error } = await supabase
      .from("generation_runs")
      .select(
        "id, created_at, status, completed_images, error_message, last_progress_message, thumb_image_path, generation_outputs (id, created_at, decade, status, error_message, image_path)",
      )
      .eq("id", runId)
      .single<GenerationRunRecord>();

    if (error || !data) {
      logError(SCOPE, errorId, error ?? new Error("Run not found"), { runId });
      return NextResponse.json(
        {
          error: "Generation run not found.",
          errorId,
        },
        { status: 404 },
      );
    }

    const baseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const formatted = {
      id: data.id,
      created_at: data.created_at,
      status: data.status,
      completed_images: data.completed_images,
      error_message: data.error_message,
      last_progress_message:
        data.last_progress_message ??
        GENERATION_PROGRESS_MESSAGES[Math.min(data.completed_images, 3)],
      thumb_image_url: data.thumb_image_path
        ? `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${data.thumb_image_path}`
        : null,
      outputs:
        data.generation_outputs?.map((output) => ({
          id: output.id,
          decade: output.decade,
          status: output.status,
          error_message: output.error_message,
          created_at: output.created_at,
          image_path: output.image_path,
          public_url: output.image_path
            ? `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${output.image_path}`
            : null,
        })) ?? [],
    };

    logInfo(SCOPE, "Generation status fetched", { runId });

    return NextResponse.json({
      data: formatted,
    });
  } catch (error) {
    logError(SCOPE, errorId, error, { runId });
    return NextResponse.json(
      {
        error: "Failed to load the generation run.",
        errorId,
      },
      { status: 500 },
    );
  }
}
