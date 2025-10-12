import Image from "next/image";
import { cn } from "@/lib/utils";

type PolaroidFrameProps = {
  label?: string;
  imageUrl?: string | null;
  placeholder?: React.ReactNode;
  className?: string;
  hover?: boolean;
  actions?: React.ReactNode;
  priority?: boolean;
  footer?: React.ReactNode | null;
};

export function PolaroidFrame({
  label,
  imageUrl,
  placeholder,
  className,
  hover = false,
  actions,
  priority = false,
  footer,
}: PolaroidFrameProps) {
  const footerContent =
    footer !== undefined
      ? footer
      : label || actions
        ? (
            <div className="flex items-center justify-between">
              {label ? (
                <span className="text-sm uppercase tracking-[0.24em] text-muted">
                  {label}
                </span>
              ) : (
                <span />
              )}
              {actions}
            </div>
          )
        : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[24px] border border-black/10 bg-white p-6 text-black shadow-[0_24px_50px_-25px_rgba(15,23,42,0.35)] transition-transform duration-300",
        hover
          ? "hover:-translate-y-1 hover:-rotate-2 hover:shadow-[0_36px_65px_-30px_rgba(15,23,42,0.4)]"
          : "",
        className,
      )}
    >
      <div className="relative w-full overflow-hidden rounded-[18px] border border-black/10 bg-neutral-100">
        <div className="relative aspect-[3/4] w-full">
          {imageUrl ? (
            <Image
              alt={label ?? "Portrait image"}
              src={imageUrl}
              fill
              sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 90vw"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center px-8 text-center text-muted">
              {placeholder ?? <span className="text-sm font-medium">Awaiting portrait…</span>}
            </div>
          )}
        </div>
      </div>
      {footerContent}
    </div>
  );
}
