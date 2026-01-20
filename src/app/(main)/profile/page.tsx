'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Trophy, Flame, Calendar, Target } from 'lucide-react';
import { Button, Card, Avatar } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { getStreakEmoji } from '@/lib/utils';
import { BADGES } from '@/lib/constants';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setIsLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const streak = profile.current_streak;
  const streakEmoji = getStreakEmoji(streak);

  // Get earned badges (simplified - in production, fetch from user_badges table)
  const earnedBadges = BADGES.filter(badge => {
    if (badge.criteria.includes('streak >=')) {
      const required = parseInt(badge.criteria.split('>=')[1]);
      return profile.longest_streak >= required;
    }
    return false;
  });

  const stats = [
    { label: 'Current Streak', value: streak, icon: Flame, color: 'text-accent' },
    { label: 'Longest Streak', value: profile.longest_streak, icon: Trophy, color: 'text-yellow-500' },
    { label: 'Days Completed', value: profile.total_days_completed, icon: Calendar, color: 'text-blue-500' },
    { label: 'Challenges Done', value: profile.total_challenges_completed, icon: Target, color: 'text-emerald-500' },
  ];

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <button onClick={() => router.push('/settings')} className="tap-target">
            <Settings className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} alt={profile.display_name || ''} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{profile.display_name}</h2>
              {streakEmoji && <span className="text-2xl">{streakEmoji}</span>}
            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map(stat => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="p-4">
        <h3 className="font-semibold mb-3">Badges ({earnedBadges.length})</h3>
        {earnedBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map(badge => (
              <Card key={badge.id} className="p-3 text-center">
                <span className="text-3xl mb-1 block">{badge.icon}</span>
                <p className="text-xs font-medium">{badge.name}</p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-center text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Complete challenges to earn badges</p>
          </Card>
        )}
      </div>

      {/* All Badges Preview */}
      <div className="p-4">
        <h3 className="font-semibold mb-3">All Badges</h3>
        <div className="grid grid-cols-4 gap-2">
          {BADGES.map(badge => {
            const isEarned = earnedBadges.some(b => b.id === badge.id);
            return (
              <div
                key={badge.id}
                className={`p-2 rounded-lg text-center ${
                  isEarned ? 'bg-card' : 'bg-muted/50 opacity-50'
                }`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-xs mt-1 truncate">{badge.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
