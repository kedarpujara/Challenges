import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: React.ReactNode;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function Avatar({ src, alt = '', size = 'md', fallback, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        fallback || <User className="w-1/2 h-1/2 text-muted-foreground" />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: { src?: string | null; alt?: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-muted flex items-center justify-center ring-2 ring-background',
            sizes[size]
          )}
        >
          <span className="text-muted-foreground font-medium">+{remaining}</span>
        </div>
      )}
    </div>
  );
}
