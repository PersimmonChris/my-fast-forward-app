import Link from "next/link";

import { ResultsViewer } from "@/components/results-viewer";
import { fetchGenerationRun } from "@/lib/data";

type ResultPageProps = {
  params: {
    runId: string;
  };
};

export default async function ResultPage({ params }: ResultPageProps) {
  const { runId } = params;
  const result = await fetchGenerationRun(runId);

  if (result.errorMessage || !result.run) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-3xl font-light uppercase tracking-[0.2em]">
          Capsule unavailable
        </h1>
        <p className="max-w-md text-sm text-muted">
          {result.errorMessage ??
            "We could not find that generation run. It may have been deleted."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/5 px-6 py-2 text-xs font-medium uppercase tracking-[0.28em] text-white transition hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Back to Generate
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-20 sm:px-10 lg:px-16">
      <ResultsViewer initialRun={result.run} />
    </main>
  );
}

