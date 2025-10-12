import type { GenerationRun } from "@/types/generation";

import { getSupabaseServiceRoleClient } from "./supabase-server";
import { STORAGE_BUCKET } from "./constants";
import { getEnv } from "./env";
import { createErrorId, logError } from "./logger";

export async function fetchPastGenerations(limit = 6) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return {
      configured: false,
      total: 0,
      items: [],
      errorMessage:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL to your environment.",
    };
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const projectUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
    const { data, error, count } = await supabase
      .from("generation_runs")
      .select(
        "id, created_at, status, completed_images, thumb_image_path, generation_outputs (decade, image_path, status)",
        {
          count: "exact",
        },
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const formatted =
      data?.map((run) => ({
        id: run.id,
        created_at: run.created_at,
        status: run.status,
        completed_images: run.completed_images,
        thumb_image_url: run.thumb_image_path
          ? `${projectUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${run.thumb_image_path}`
          : null,
        outputs:
          run.generation_outputs?.map((output) => ({
            decade: output.decade,
            status: output.status,
            public_url: output.image_path
              ? `${projectUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${output.image_path}`
              : null,
          })) ?? [],
      })) ?? [];

    return {
      configured: true,
      total: count ?? 0,
      items: formatted,
    };
  } catch (error) {
    const errorId = createErrorId("data", "PAST");
    logError("data", errorId, error);
    return {
      configured: true,
      total: 0,
      items: [],
      errorMessage: `Failed to load past generations. errorId=${errorId}`,
    };
  }
}

export async function fetchGenerationRun(
  runId: string,
): Promise<
  | { run: GenerationRun; errorMessage?: undefined }
  | { run?: undefined; errorMessage: string }
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      errorMessage: "Supabase environment variables are missing.",
    };
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("generation_runs")
      .select(
        "id, created_at, input_image_path, status, completed_images, error_message, last_progress_message, thumb_image_path, generation_outputs (id, created_at, decade, status, error_message, image_path)",
      )
      .eq("id", runId)
      .single();

    if (error || !data) {
      return {
        errorMessage: "We could not find that time capsule run.",
      };
    }

    const projectUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");

    const run: GenerationRun = {
      id: data.id,
      created_at: data.created_at,
      input_image_path: data.input_image_path ?? null,
      thumb_image_path: data.thumb_image_path,
      status: data.status,
      completed_images: data.completed_images,
      error_message: data.error_message,
      last_progress_message: data.last_progress_message,
      outputs:
        data.generation_outputs?.map((output) => ({
          id: output.id,
          created_at: output.created_at,
          run_id: data.id,
          decade: output.decade,
          status: output.status,
          error_message: output.error_message,
          image_path: output.image_path,
          public_url: output.image_path
            ? `${projectUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${output.image_path}`
            : null,
        })) ?? [],
    };

    return { run };
  } catch (error) {
    const errorId = createErrorId("data", "RUN");
    logError("data", errorId, error, { runId });
    return {
      errorMessage: `Failed to load this time capsule. errorId=${errorId}`,
    };
  }
}
