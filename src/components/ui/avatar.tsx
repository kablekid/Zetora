import Image from 'next/image';
import { cn, initials } from '@/lib/utils';

export function UserAvatar({
  name,
  src,
  className,
  size = 36,
}: {
  name?: string | null;
  src?: string | null;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      aria-hidden
    >
      {src ? <Image src={src} alt="" width={size * 2} height={size * 2} className="size-full object-cover" /> : initials(name)}
    </span>
  );
}
