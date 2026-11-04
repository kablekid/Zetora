import Link from 'next/link';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id="zt-g" x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#zt-g)" />
      <path d="M9.5 10.5h13L9.5 21.5h13" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24.5" cy="8" r="2.4" fill="#5B8CFF" stroke="#fff" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({
  className,
  href = '/',
  inverted = false,
  withWordmark = true,
}: {
  className?: string;
  href?: string | null;
  inverted?: boolean;
  withWordmark?: boolean;
}) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {withWordmark && (
        <span className={cn('text-[19px] font-bold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label={`${APP_NAME} home`} className="inline-flex rounded-lg">
      {content}
    </Link>
  );
}
