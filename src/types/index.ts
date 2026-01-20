// Database types

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  total_challenges_completed: number;
  total_days_completed: number;
  longest_streak: number;
  current_streak: number;
  created_at: string;
  updated_at: string;
}

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  category: string | null;
  icon: string | null;
  color: string | null;
  is_official: boolean;
  created_by: string | null;
  metrics: Metric[];
  created_at: string;
}

export interface Challenge {
  id: string;
  template_id: string | null;
  owner_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  metrics: Metric[];
  invite_code: string;
  visibility: 'public' | 'friends' | 'private';
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  is_bot: boolean;
  bot_type: 'consistent' | 'human' | 'struggling' | null;
  bot_name: string | null;
  bot_avatar: string | null;
  days_completed: number;
  current_streak: number;
  longest_streak: number;
  status: 'active' | 'left' | 'removed';
  joined_at: string;
  // Joined data
  profile?: Profile;
}

export interface DailyEntry {
  id: string;
  challenge_id: string;
  participant_id: string;
  entry_date: string;
  day_number: number;
  metrics_data: Record<string, MetricEntry>;
  is_complete: boolean;
  pass_count: number;
  fail_count: number;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  challenge_id: string | null;
}

// Metric types

export type MetricType = 'boolean' | 'number' | 'count' | 'photo';
export type MetricComparison = 'gte' | 'lte' | 'eq';
export type MetricStatus = 'pass' | 'fail' | 'pending';

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  target?: number;
  comparison?: MetricComparison;
  unit?: string;
  required: boolean;
  tracking?: boolean; // For count metrics that don't count toward pass/fail
  icon?: string; // Icon identifier for the metric
}

export interface MetricEntry {
  status: MetricStatus;
  value?: number;
}

// Badge types

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
}

// UI types

export interface ChallengeWithParticipants extends Challenge {
  participants: ChallengeParticipant[];
  my_participant?: ChallengeParticipant;
  today_entry?: DailyEntry;
}

export interface ParticipantWithEntry extends ChallengeParticipant {
  today_entry?: DailyEntry;
}

// Form types

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface OnboardingFormData {
  username: string;
  display_name: string;
  timezone: string;
}

export interface CreateChallengeFormData {
  template_id?: string;
  name: string;
  description?: string;
  start_date: string;
  duration_days: number;
  visibility: 'public' | 'friends' | 'private';
}

// Stats types

export interface DailyStats {
  date: string;
  day_number: number;
  pass_count: number;
  fail_count: number;
  total_metrics: number;
}

export interface ParticipantStats {
  participant_id: string;
  name: string;
  avatar_url: string | null;
  is_bot: boolean;
  average_completion: number;
  current_streak: number;
  total_days: number;
  daily_stats: DailyStats[];
}

export interface MetricSuccessRate {
  metric_id: string;
  metric_name: string;
  pass_count: number;
  fail_count: number;
  total_count: number;
  success_rate: number;
}
