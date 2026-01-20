'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { Card, Button, SegmentedProgress } from '@/components/ui';
import { useChallenges } from '@/hooks/useChallenge';
import { getDayNumber } from '@/lib/utils';
import type { ChallengeWithParticipants, Metric } from '@/types';

export default function CheckInPage() {
  const router = useRouter();
  const { data: challenges, isLoading } = useChallenges();

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const activeChallenges = challenges?.filter(c => c.status === 'active') || [];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold">Daily Check-in</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your progress for today
        </p>
      </div>

      {activeChallenges.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Active Challenges</h2>
          <p className="text-muted-foreground mb-4">
            Join or create a challenge to start tracking
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/challenges/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
            <Button variant="outline" onClick={() => router.push('/challenges/join')}>
              Join Challenge
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 flex flex-col gap-8">
          {activeChallenges.map(challenge => (
            <ChallengeCheckInCard key={challenge.id} challenge={challenge} />
          ))}

          {/* Quick link to create */}
          <Card className="p-4 border-dashed mt-8">
            <Link href="/challenges/create" className="flex items-center gap-3 text-muted-foreground">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm">Create new challenge</span>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}

function ChallengeCheckInCard({ challenge }: { challenge: ChallengeWithParticipants }) {
  const dayNumber = getDayNumber(challenge.start_date);
  const metrics = challenge.metrics as Metric[];
  const requiredMetrics = metrics.filter(m => m.required && !m.tracking);

  // Get today's entry status
  const todayEntry = challenge.today_entry;
  const metricsData = todayEntry?.metrics_data || {};

  let passCount = 0;
  let failCount = 0;
  requiredMetrics.forEach(metric => {
    const entry = metricsData[metric.id];
    if (entry?.status === 'pass') passCount++;
    else if (entry?.status === 'fail') failCount++;
  });
  const pendingCount = requiredMetrics.length - passCount - failCount;

  const isComplete = pendingCount === 0 && requiredMetrics.length > 0;
  const hasStarted = passCount > 0 || failCount > 0;

  // Completed state - simple success display (not a button)
  if (isComplete) {
    return (
      <Link href={`/challenges/${challenge.id}`}>
        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <h3 className="font-semibold">{challenge.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Day {dayNumber} of {challenge.duration_days}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Progress bar */}
            <SegmentedProgress
              segments={[
                { value: passCount, color: 'bg-success' },
                { value: failCount, color: 'bg-destructive' },
              ]}
              total={requiredMetrics.length}
              className="mb-2"
            />
            <div className="flex justify-between text-xs mb-4">
              <span className="text-success">{passCount}/{requiredMetrics.length} passed</span>
              {failCount > 0 && (
                <span className="text-destructive">{failCount} failed</span>
              )}
            </div>

            {/* Completed today indicator (not a button) */}
            <div className="bg-success/10 text-success rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium">
              <CheckCircle className="w-5 h-5" />
              Completed today
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Active/Incomplete state - prominent orange check-in button
  return (
    <Link href={`/challenges/${challenge.id}/checkin`}>
      <Card className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold">{challenge.name}</h3>
              <p className="text-sm text-muted-foreground">
                Day {dayNumber} of {challenge.duration_days}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <SegmentedProgress
            segments={[
              { value: passCount, color: 'bg-success' },
              { value: failCount, color: 'bg-destructive' },
              { value: pendingCount, color: 'bg-muted' },
            ]}
            total={requiredMetrics.length}
            className="mb-2"
          />
          <div className="flex justify-between text-xs mb-4">
            <span className={passCount > 0 ? 'text-success' : 'text-muted-foreground'}>
              {passCount}/{requiredMetrics.length} passed
            </span>
            <span className="text-muted-foreground">
              {pendingCount} remaining
            </span>
          </div>

          {/* Prominent check-in button */}
          <div className="bg-accent text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium">
            {pendingCount > 0 && <CheckCircle className="w-5 h-5" />}
            {hasStarted ? 'Continue Check-in' : 'Start Check-in'}
          </div>
        </div>
      </Card>
    </Link>
  );
}
