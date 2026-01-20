'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useJoinChallenge } from '@/hooks/useChallenge';

export default function JoinChallengePage() {
  const router = useRouter();
  const joinChallenge = useJoinChallenge();

  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      setError('Please enter a valid 6-character invite code');
      return;
    }

    setError(null);
    try {
      const challenge = await joinChallenge.mutateAsync(inviteCode);
      router.push(`/challenges/${challenge.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow alphanumeric, convert to uppercase
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setInviteCode(cleaned);
    setError(null);
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">Join Challenge</h1>
            <p className="text-sm text-muted-foreground">Enter an invite code</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <Users className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Join with Code</h2>
          <p className="text-muted-foreground mb-6">
            Enter the 6-character invite code shared with you
          </p>

          <div className="space-y-4">
            <Input
              value={inviteCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="XXXXXX"
              className="text-center text-2xl tracking-[0.5em] font-mono uppercase"
              maxLength={6}
              error={error || undefined}
            />

            <Button
              className="w-full"
              onClick={handleJoin}
              isLoading={joinChallenge.isPending}
              disabled={inviteCode.length !== 6}
            >
              Join Challenge
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Don&apos;t have a code?</p>
          <button
            onClick={() => router.push('/challenges/create')}
            className="link mt-1"
          >
            Create your own challenge
          </button>
        </div>
      </div>
    </div>
  );
}
