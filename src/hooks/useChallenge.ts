'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ChallengeWithParticipants, Metric } from '@/types';
import { generateInviteCode, getTodayDateString } from '@/lib/utils';

export function useChallenges() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get challenges owned by user
      const { data: ownedChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'active');

      // Get challenges user participates in
      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const participatedIds = participations?.map(p => p.challenge_id) || [];

      // Combine owned and participated challenges
      const allChallengeIds = [
        ...(ownedChallenges?.map(c => c.id) || []),
        ...participatedIds,
      ];
      const uniqueChallengeIds = Array.from(new Set(allChallengeIds));

      if (uniqueChallengeIds.length === 0) return [];

      // Get full challenge data
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .in('id', uniqueChallengeIds)
        .eq('status', 'active');

      if (!challenges || challenges.length === 0) return [];

      // Get all participants for these challenges
      const { data: allParticipants } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          profile:profiles(*)
        `)
        .in('challenge_id', uniqueChallengeIds)
        .eq('status', 'active');

      // Get today's entries
      const today = getTodayDateString();
      const { data: todayEntries } = await supabase
        .from('daily_entries')
        .select('*')
        .in('challenge_id', uniqueChallengeIds)
        .eq('entry_date', today);

      // Combine the data
      const result: ChallengeWithParticipants[] = challenges.map(challenge => {
        const challengeParticipants = allParticipants?.filter(
          ap => ap.challenge_id === challenge.id
        ) || [];
        const myParticipant = challengeParticipants.find(cp => cp.user_id === user.id);
        const todayEntry = todayEntries?.find(
          e => e.participant_id === myParticipant?.id
        );

        return {
          ...challenge,
          participants: challengeParticipants,
          my_participant: myParticipant,
          today_entry: todayEntry,
        };
      });

      return result;
    },
  });
}

export function useChallenge(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: challenge, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get participants with profiles
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('challenge_id', id)
        .eq('status', 'active');

      // Get today's entries for all participants
      const today = getTodayDateString();
      const { data: todayEntries } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('challenge_id', id)
        .eq('entry_date', today);

      const myParticipant = participants?.find(p => p.user_id === user.id);
      const todayEntry = todayEntries?.find(e => e.participant_id === myParticipant?.id);

      return {
        ...challenge,
        participants: participants || [],
        my_participant: myParticipant,
        today_entry: todayEntry,
      } as ChallengeWithParticipants;
    },
    enabled: !!id,
  });
}

export function useCreateChallenge() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      start_date: string;
      duration_days: number;
      metrics: Metric[];
      visibility: 'public' | 'friends' | 'private';
      template_id?: string;
    }) => {
      console.log('[useCreateChallenge] Starting...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[useCreateChallenge] Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      if (!user) throw new Error('Not authenticated');

      console.log('[useCreateChallenge] User:', user.id);

      const startDate = new Date(data.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + data.duration_days - 1);

      const insertData = {
        owner_id: user.id,
        name: data.name,
        description: data.description,
        start_date: data.start_date,
        end_date: endDate.toISOString().split('T')[0],
        duration_days: data.duration_days,
        metrics: data.metrics,
        visibility: data.visibility,
        invite_code: generateInviteCode(),
        template_id: data.template_id,
      };

      console.log('[useCreateChallenge] Inserting challenge:', insertData);

      // Create challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert(insertData)
        .select()
        .single();

      if (challengeError) {
        console.error('[useCreateChallenge] Challenge insert error:', challengeError);
        throw new Error('Failed to create challenge: ' + challengeError.message);
      }

      console.log('[useCreateChallenge] Challenge created:', challenge);

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
        });

      if (participantError) {
        console.error('[useCreateChallenge] Participant insert error:', participantError);
        throw new Error('Failed to add you as participant: ' + participantError.message);
      }

      console.log('[useCreateChallenge] Success!');
      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useJoinChallenge() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find challenge by invite code
      const { data: challenge, error: findError } = await supabase
        .from('challenges')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (findError || !challenge) {
        throw new Error('Invalid invite code');
      }

      // Check if already a participant
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        throw new Error('Already joined this challenge');
      }

      // Join challenge
      const { error: joinError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
        });

      if (joinError) throw joinError;

      return challenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}
