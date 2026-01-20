'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share2, Calendar, Users, BarChart3, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button, Card, Tabs, TabContent, Avatar, SegmentedProgress } from '@/components/ui';
import { useChallenge } from '@/hooks/useChallenge';
import { getDayNumber, getStreakEmoji } from '@/lib/utils';
import type { Metric, MetricEntry, ChallengeWithParticipants, DailyEntry, ChallengeParticipant } from '@/types';

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');

  const { data: challenge, isLoading, error } = useChallenge(id);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">Challenge not found</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const dayNumber = getDayNumber(challenge.start_date);
  const todayEntry = challenge.today_entry;
  const requiredMetrics = (challenge.metrics as Metric[]).filter(m => m.required);
  const passCount = todayEntry?.pass_count || 0;
  const failCount = todayEntry?.fail_count || 0;
  const pendingCount = requiredMetrics.length - passCount - failCount;

  const tabs = [
    { value: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
    { value: 'people', label: 'People', icon: <Users className="w-4 h-4" /> },
    { value: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold truncate">{challenge.name}</h1>
            <p className="text-sm text-muted-foreground">Day {dayNumber} of {challenge.duration_days}</p>
          </div>
          <button className="tap-target">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Today&apos;s Progress</span>
            <Link href={`/challenges/${id}/checkin`}>
              <Button size="sm">Check In</Button>
            </Link>
          </div>

          <SegmentedProgress
            segments={[
              { value: passCount, color: 'bg-success' },
              { value: failCount, color: 'bg-destructive' },
              { value: pendingCount, color: 'bg-muted' },
            ]}
            total={requiredMetrics.length}
            className="mb-3"
          />

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>{passCount} passed</span>
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <XCircle className="w-4 h-4" />
              <span>{failCount} failed</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{pendingCount} pending</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} tabs={tabs} />

      {/* Tab Content */}
      <div className="p-4">
        <TabContent value="today" activeValue={activeTab}>
          <TodayTab challenge={challenge} todayEntry={todayEntry} />
        </TabContent>

        <TabContent value="people" activeValue={activeTab}>
          <PeopleTab challenge={challenge} />
        </TabContent>

        <TabContent value="stats" activeValue={activeTab}>
          <StatsTab />
        </TabContent>
      </div>
    </div>
  );
}

function TodayTab({ challenge, todayEntry }: { challenge: ChallengeWithParticipants; todayEntry: DailyEntry | undefined }) {
  const metrics = challenge.metrics as Metric[];
  const metricsData = (todayEntry?.metrics_data || {}) as Record<string, MetricEntry>;

  return (
    <div className="space-y-3">
      {metrics.map(metric => {
        const entry = metricsData[metric.id];
        const status = entry?.status || 'pending';

        return (
          <Card key={metric.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{metric.name}</p>
                {metric.type === 'number' && entry?.value !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {entry.value} {metric.unit}
                  </p>
                )}
                {!metric.required && (
                  <p className="text-xs text-muted-foreground">Optional</p>
                )}
              </div>
              <div>
                {status === 'pass' && (
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                )}
                {status === 'fail' && (
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                )}
                {status === 'pending' && (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <div className="pt-4">
        <Link href={`/challenges/${challenge.id}/checkin`}>
          <Button className="w-full">
            {todayEntry ? 'Update Check-in' : 'Check In Now'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PeopleTab({ challenge }: { challenge: ChallengeWithParticipants }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{challenge.participants.length} Participants</h3>
        <Button size="sm" variant="outline">Invite</Button>
      </div>

      {challenge.participants.map((participant: ChallengeParticipant) => {
        const name = participant.is_bot
          ? participant.bot_name
          : participant.profile?.display_name || participant.profile?.username || 'User';
        const streak = participant.current_streak;
        const streakEmoji = getStreakEmoji(streak);

        return (
          <Card key={participant.id} className="p-3">
            <div className="flex items-center gap-3">
              <Avatar
                src={participant.is_bot ? null : participant.profile?.avatar_url}
                alt={name || undefined}
                size="md"
                fallback={participant.is_bot ? (
                  <span className="text-lg">{participant.bot_avatar || '🤖'}</span>
                ) : undefined}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{name}</p>
                  {participant.is_bot && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Bot</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {participant.days_completed} days completed
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {streakEmoji && <span>{streakEmoji}</span>}
                  <span className="font-semibold">{streak}</span>
                </div>
                <p className="text-xs text-muted-foreground">streak</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StatsTab() {
  return (
    <div className="text-center py-8">
      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">Stats coming soon</p>
      <p className="text-sm text-muted-foreground mt-2">
        Track completion rates, streaks, and more
      </p>
    </div>
  );
}
