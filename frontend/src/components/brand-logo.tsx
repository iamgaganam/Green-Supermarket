import { cn } from "@/lib/utils";

interface BrandLogoProps {
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: number;
}

export default function BrandLogo({
  alt = "GREEN Supermarket logo",
  className,
  imageClassName: _imageClassName,
  priority = false,
  size = 40,
}: BrandLogoProps) {
  const titleId = priority ? "green-brand-logo-priority" : "green-brand-logo";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[28%] bg-white/90 shadow-sm ring-1 ring-emerald-200/80",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={alt}
      role="img"
    >
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{alt}</title>
        <defs>
          <linearGradient id="green-brand-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="#ecfdf5" />
        <circle cx="32" cy="32" r="24" fill="url(#green-brand-gradient)" />
        <path
          d="M21 35.5c8.2-.3 13.5-3.8 17.9-12.5 2 7.3.9 14.7-4.8 18.5-5.4 3.5-11.7 2.8-15.8-1.6 1.2-2 1.8-3 2.7-4.4Z"
          fill="#f0fdf4"
        />
        <path
          d="M25.5 22.2c8 1.3 13.8 5.5 15.8 14.3-6.3-1.3-10.8-4.3-13.7-9.4-.8-1.4-1.4-2.9-2.1-4.9Z"
          fill="#bbf7d0"
          opacity="0.95"
        />
        <path
          d="M29 39.5c.9-7.4 4.7-13 12.6-16.6"
          fill="none"
          stroke="#ecfdf5"
          strokeLinecap="round"
          strokeWidth="2.8"
        />
      </svg>
    </span>
  );
}
