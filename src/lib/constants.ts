import type { Metric, Badge, ChallengeTemplate } from '@/types';

export const METRICS_75_HARD: Metric[] = [
  {
    id: 'steps',
    name: '10K Steps',
    type: 'number',
    target: 10000,
    comparison: 'gte',
    unit: 'steps',
    required: true,
  },
  {
    id: 'screen_time',
    name: 'Screen Time < 3h',
    type: 'number',
    target: 180,
    comparison: 'lte',
    unit: 'min',
    required: true,
  },
  {
    id: 'pickups',
    name: 'Pickups < 100',
    type: 'number',
    target: 100,
    comparison: 'lte',
    unit: '',
    required: true,
  },
  {
    id: 'water',
    name: '½ Gallon Water',
    type: 'boolean',
    required: true,
  },
  {
    id: 'alcohol',
    name: 'No Alcohol',
    type: 'boolean',
    required: true,
  },
  {
    id: 'weed',
    name: 'Weed Usage',
    type: 'count',
    tracking: true,
    required: false,
  },
  {
    id: 'masturbation',
    name: 'Masturbation',
    type: 'count',
    tracking: true,
    required: false,
  },
  {
    id: 'workout',
    name: '45min Workout',
    type: 'boolean',
    required: false,
  },
  {
    id: 'photo',
    name: 'Daily Photo',
    type: 'photo',
    required: true,
  },
];

export const METRICS_75_SOFT: Metric[] = [
  {
    id: 'steps',
    name: '8K Steps',
    type: 'number',
    target: 8000,
    comparison: 'gte',
    unit: 'steps',
    required: true,
  },
  {
    id: 'screen_time',
    name: 'Screen Time < 4h',
    type: 'number',
    target: 240,
    comparison: 'lte',
    unit: 'min',
    required: true,
  },
  {
    id: 'water',
    name: '½ Gallon Water',
    type: 'boolean',
    required: true,
  },
  {
    id: 'workout',
    name: '30min Exercise',
    type: 'boolean',
    required: true,
  },
  {
    id: 'reading',
    name: '10min Reading',
    type: 'boolean',
    required: true,
  },
];

export const METRICS_30_DAY: Metric[] = [
  {
    id: 'main_goal',
    name: 'Daily Goal',
    type: 'boolean',
    required: true,
  },
  {
    id: 'reflection',
    name: 'Daily Reflection',
    type: 'boolean',
    required: false,
  },
];

export const CHALLENGE_TEMPLATES: Omit<ChallengeTemplate, 'id' | 'created_at' | 'created_by'>[] = [
  {
    name: '75 Hard',
    description: 'The ultimate mental toughness program. 75 days of strict discipline.',
    duration_days: 75,
    difficulty: 'extreme',
    category: 'fitness',
    icon: '💪',
    color: '#f97316',
    is_official: true,
    metrics: METRICS_75_HARD,
  },
  {
    name: '75 Soft',
    description: 'A gentler version of 75 Hard with more flexibility.',
    duration_days: 75,
    difficulty: 'hard',
    category: 'fitness',
    icon: '🌟',
    color: '#eab308',
    is_official: true,
    metrics: METRICS_75_SOFT,
  },
  {
    name: '30 Day Challenge',
    description: 'Build a new habit in 30 days.',
    duration_days: 30,
    difficulty: 'medium',
    category: 'habits',
    icon: '🎯',
    color: '#10b981',
    is_official: true,
    metrics: METRICS_30_DAY,
  },
];

export const BADGES: Badge[] = [
  {
    id: 'first_flame',
    name: 'First Flame',
    icon: '🔥',
    description: 'Complete your first day',
    criteria: 'streak >= 1',
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    icon: '⚔️',
    description: 'Maintain a 7-day streak',
    criteria: 'streak >= 7',
  },
  {
    id: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    icon: '🛡️',
    description: 'Maintain a 14-day streak',
    criteria: 'streak >= 14',
  },
  {
    id: 'month_master',
    name: 'Month Master',
    icon: '👑',
    description: 'Maintain a 30-day streak',
    criteria: 'streak >= 30',
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    icon: '🏆',
    description: 'Complete the full 75 Hard challenge',
    criteria: 'streak >= 75',
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    icon: '💯',
    description: '7 consecutive days with 100% metrics',
    criteria: 'perfect_week',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    icon: '🐦',
    description: 'Check in before 9 AM',
    criteria: 'early_checkin',
  },
  {
    id: 'photographer',
    name: 'Photographer',
    icon: '📸',
    description: 'Upload 30 daily photos',
    criteria: 'photos >= 30',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    icon: '🦋',
    description: 'Invite 5 friends to a challenge',
    criteria: 'invites >= 5',
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    icon: '📈',
    description: 'Maintain 90%+ completion rate for 30 days',
    criteria: 'completion_rate >= 90 for 30 days',
  },
];

export const BOT_CONFIGS = {
  consistent: {
    name: 'Consistent Carl',
    avatar: '🤖',
    successRate: 0.95,
    variance: 0.03,
    personality: 'Almost perfect, rarely misses',
  },
  human: {
    name: 'Human Hannah',
    avatar: '👩',
    successRate: 0.85,
    variance: 0.1,
    weekendDip: 0.15, // Lower completion on weekends
    personality: 'Realistic patterns with weekend dips',
  },
  struggling: {
    name: 'Struggling Steve',
    avatar: '😅',
    successRate: 0.65,
    variance: 0.2,
    personality: 'Trying hard but inconsistent',
  },
} as const;

export const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];
