import { STORAGE_BUCKET } from "./constants";
import { getEnv } from "./env";

export function getPublicUrl(path: string) {
  const baseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export function inputImagePath(runId: string, filename: string) {
  return `inputs/${runId}/${filename}`;
}

export function outputImagePath(runId: string, decade: string) {
  const sanitized = decade.replace(/\s+/g, "-").toLowerCase();
  return `outputs/${runId}/${sanitized}.png`;
}

