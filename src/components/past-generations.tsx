import Link from "next/link";

import { PolaroidFrame } from "./polaroid-frame";

type PastGeneration = {
  id: string;
  created_at: string;
  status: string;
  completed_images: number;
  thumb_image_url: string | null;
  outputs: {
    decade: string;
    status: string;
    public_url: string | null;
  }[];
};

type PastGenerationsProps = {
  totalCount: number;
  items: PastGeneration[];
};

export function PastGenerations({ totalCount, items }: PastGenerationsProps) {
  if (!items.length) {
    return (
      <section className="mt-24 w-full max-w-5xl space-y-4">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg uppercase tracking-[0.3em] text-muted">
            Past Generations
          </h2>
          <span className="text-xs text-muted">
            {totalCount} total {totalCount === 1 ? "set" : "sets"}
          </span>
        </header>
        <div className="rounded-[18px] border border-dashed border-card/70 bg-card/60 p-8 text-sm text-muted">
          Your future postcards will appear here once you generate them.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-24 w-full max-w-5xl space-y-6">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg uppercase tracking-[0.3em] text-muted">
          Past Generations
        </h2>
        <span className="text-xs text-muted">
          {totalCount} total {totalCount === 1 ? "set" : "sets"}
        </span>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const cover =
            item.outputs.find((output) => output.public_url)?.public_url ??
            item.thumb_image_url;

          return (
            <Link
              key={item.id}
              href={`/results/${item.id}`}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <PolaroidFrame
                imageUrl={cover ?? undefined}
                placeholder={<span className="text-xs">Awaiting postcard</span>}
                hover
                footer={null}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
