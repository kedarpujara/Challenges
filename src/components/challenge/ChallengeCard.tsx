'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, AvatarGroup, Progress } from '@/components/ui';
import type { ChallengeWithParticipants, Metric } from '@/types';
import { getDayNumber, getStreakEmoji } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: ChallengeWithParticipants;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const dayNumber = getDayNumber(challenge.start_date);
  const totalDays = challenge.duration_days;
  const progressPercent = Math.min(100, (dayNumber / totalDays) * 100);

  const todayEntry = challenge.today_entry;
  const requiredMetrics = (challenge.metrics as Metric[]).filter(m => m.required);
  const passCount = todayEntry?.pass_count || 0;
  const totalRequired = requiredMetrics.length;

  const streak = challenge.my_participant?.current_streak || 0;
  const streakEmoji = getStreakEmoji(streak);

  const avatars = challenge.participants.map(p => ({
    src: p.is_bot ? null : p.profile?.avatar_url,
    alt: (p.is_bot ? p.bot_name : p.profile?.display_name) || undefined,
  }));

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{challenge.name}</h3>
              {streakEmoji && (
                <span className="text-lg">{streakEmoji}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Day {dayNumber} of {totalDays}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={progressPercent} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercent)}% complete</span>
              <span>{totalDays - dayNumber} days left</span>
            </div>
          </div>

          {/* Today's status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AvatarGroup avatars={avatars} max={4} size="xs" />
              <span className="text-xs text-muted-foreground">
                {challenge.participants.length} participant{challenge.participants.length !== 1 ? 's' : ''}
              </span>
            </div>

            {todayEntry ? (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-success font-medium">{passCount}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{totalRequired}</span>
                <span className="text-muted-foreground text-xs">today</span>
              </div>
            ) : (
              <span className="text-xs text-accent">Check in today</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
