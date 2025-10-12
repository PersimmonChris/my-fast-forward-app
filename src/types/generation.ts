import type { GENERATION_DECADES } from "@/lib/constants";

export type Decade = (typeof GENERATION_DECADES)[number];

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export type GenerationOutputStatus = "pending" | "completed" | "failed";

export type GenerationOutput = {
  id: string;
  created_at: string;
  run_id: string;
  decade: Decade;
  image_path: string | null;
  public_url: string | null;
  status: GenerationOutputStatus;
  error_message: string | null;
};

export type GenerationRun = {
  id: string;
  created_at: string;
  input_image_path: string | null;
  thumb_image_path: string | null;
  status: GenerationStatus;
  completed_images: number;
  error_message: string | null;
  last_progress_message: string | null;
  outputs: GenerationOutput[];
};

