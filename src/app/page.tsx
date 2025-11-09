import { PastGenerations } from "@/components/past-generations";
import { UploadForm } from "@/components/upload-form";
import { FlipWords } from "@/components/ui/flip-words";
import { fetchPastGenerations } from "@/lib/data";

export const revalidate = 0;

export default async function Home() {
  const pastGenerations = await fetchPastGenerations();

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center gap-16 px-6 py-20 sm:px-10 lg:px-16">
      <header className="mt-8 flex flex-col items-center gap-4 text-center sm:gap-5">
        <span className="text-xs uppercase tracking-[0.38em] text-muted">
          Time Capsule
        </span>
        <h1 className="text-4xl font-light tracking-[0.08em] text-balance sm:text-5xl">
          What would you have looked like in the{" "}
          <span className="inline-flex items-baseline">
            <FlipWords
              words={["1970s", "1980s", "1990s"]}
              className="px-0 text-muted"
            />
            <span>?</span>
          </span>
        </h1>
        <p className="max-w-2xl text-sm text-muted sm:text-base">
          Upload a single photo and watch Gemini reinterpret you through the 70s,
          80s, and 90s. Each postcard lands in real time, one decade at a time.
        </p>
      </header>

      <UploadForm pastRunCount={pastGenerations.total} />

      {pastGenerations.errorMessage ? (
        <p className="text-sm text-red-400">{pastGenerations.errorMessage}</p>
      ) : (
        <PastGenerations
          totalCount={pastGenerations.total}
          items={pastGenerations.items}
        />
      )}
    </main>
  );
}
