'use client';

import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Tab[];
  className?: string;
}

export function Tabs({ value, onValueChange, tabs, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            'flex-1 py-3 px-4 text-center font-medium transition-colors relative flex items-center justify-center gap-2',
            value === tab.value
              ? 'text-accent'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.icon}
          {tab.label}
          {value === tab.value && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}

interface TabContentProps {
  value: string;
  activeValue: string;
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ value, activeValue, children, className }: TabContentProps) {
  if (value !== activeValue) return null;
  return <div className={cn('animate-fade-in', className)}>{children}</div>;
}
