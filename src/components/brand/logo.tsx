import Link from 'next/link';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

/**
 * The mark is a CSS-gradient tile with an inline-SVG "Z". (An SVG <linearGradient id> would be
 * duplicated per instance and breaks when the first copy sits inside a display:none subtree.)
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size, borderRadius: size * 0.28, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M9.5 10.5h13L9.5 21.5h13" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24.5" cy="8" r="2.4" fill="#5B8CFF" stroke="#fff" strokeWidth="1.2" />
      </svg>
    </span>
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
