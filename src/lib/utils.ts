import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

export function getDayNumber(startDate: string, currentDate?: string): number {
  // Parse dates as local dates to avoid timezone issues
  // startDate format: "YYYY-MM-DD"
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);

  let current: Date;
  if (currentDate) {
    const [curYear, curMonth, curDay] = currentDate.split('-').map(Number);
    current = new Date(curYear, curMonth - 1, curDay);
  } else {
    current = new Date();
    current.setHours(0, 0, 0, 0);
  }

  const diffTime = current.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getDateForDay(startDate: string, dayNumber: number): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = startDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  start.setDate(start.getDate() + dayNumber - 1);
  // Format as YYYY-MM-DD in local time
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateCompletionPercentage(passCount: number, totalRequired: number): number {
  if (totalRequired === 0) return 100;
  return Math.round((passCount / totalRequired) * 100);
}

export function getSuccessRateColor(rate: number): string {
  if (rate >= 90) return 'text-success';
  if (rate >= 70) return 'text-amber-500';
  return 'text-destructive';
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 75) return '🏆';
  if (streak >= 30) return '👑';
  if (streak >= 14) return '🛡️';
  if (streak >= 7) return '⚔️';
  if (streak >= 1) return '🔥';
  return '';
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/New_York';
  }
}

export function evaluateMetric(
  type: string,
  value: number | undefined,
  target: number | undefined,
  comparison: string | undefined
): boolean {
  if (type === 'boolean' || type === 'photo') {
    return true; // Pass if checked
  }

  if (type === 'count') {
    return true; // Count metrics don't pass/fail
  }

  if (type === 'number' && value !== undefined && target !== undefined) {
    switch (comparison) {
      case 'gte':
        return value >= target;
      case 'lte':
        return value <= target;
      case 'eq':
        return value === target;
      default:
        return value >= target;
    }
  }

  return false;
}
