'use client';

import Link from 'next/link';
import { Plus, UserPlus, Flame, Target } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { useChallenges } from '@/hooks/useChallenge';

export default function DashboardPage() {
  const { data: challenges, isLoading, error } = useChallenges();

  // Calculate overall stats
  const totalStreak = challenges?.reduce((max, c) =>
    Math.max(max, c.my_participant?.current_streak || 0), 0
  ) || 0;
  const totalDays = challenges?.reduce((sum, c) =>
    sum + (c.my_participant?.days_completed || 0), 0
  ) || 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">Your daily accountability</p>
        </div>
        <Flame className="w-8 h-8 text-accent" />
      </div>

      {/* Stats Card */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">{totalStreak}</div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{totalDays}</div>
            <div className="text-sm text-muted-foreground">Total Days</div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/challenges/create">
          <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
            <Plus className="w-5 h-5" />
            <span>New Challenge</span>
          </Button>
        </Link>
        <Link href="/challenges/join">
          <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
            <UserPlus className="w-5 h-5" />
            <span>Join Challenge</span>
          </Button>
        </Link>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active Challenges</h2>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-2 bg-muted rounded mb-3" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="p-4 text-center text-destructive">
            Failed to load challenges
          </Card>
        )}

        {!isLoading && challenges?.length === 0 && (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No active challenges</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new challenge or join one with an invite code
            </p>
            <Link href="/challenges/create">
              <Button>Create Challenge</Button>
            </Link>
          </Card>
        )}

        {challenges?.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}
