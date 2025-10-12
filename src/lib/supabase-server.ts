import { createClient } from "@supabase/supabase-js";

import type { Decade } from "@/types/generation";

import { assertServerEnv, getEnv } from "./env";
import { logInfo } from "./logger";

const SCOPE = "supabase-server";

let cachedClient:
  | ReturnType<typeof createClient<Database>>
  | null = null;

export type Database = {
  public: {
    Tables: {
      generation_runs: {
        Row: {
          id: string;
          created_at: string;
          input_image_path: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          completed_images: number;
          error_message: string | null;
          last_progress_message: string | null;
          thumb_image_path: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          input_image_path?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          completed_images?: number;
          error_message?: string | null;
          last_progress_message?: string | null;
          thumb_image_path?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["generation_runs"]["Insert"]
        >;
        Relationships: [];
      };
      generation_outputs: {
        Row: {
          id: string;
          created_at: string;
          run_id: string;
          decade: Decade;
          image_path: string | null;
          status: "pending" | "completed" | "failed";
          error_message: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          run_id: string;
          decade: Decade;
          image_path?: string | null;
          status?: "pending" | "completed" | "failed";
          error_message?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["generation_outputs"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "generation_outputs_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "generation_runs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export function getSupabaseServiceRoleClient() {
  if (cachedClient) {
    return cachedClient;
  }

  assertServerEnv();

  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE");

  cachedClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "X-Time-Capsule-Client": "server",
      },
    },
  });

  logInfo(SCOPE, "Initialized Supabase service role client");

  return cachedClient;
}
