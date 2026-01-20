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

      // PARALLEL: Get owned challenges AND participations at the same time
      const [ownedResult, participationsResult] = await Promise.all([
        supabase
          .from('challenges')
          .select('*')
          .eq('owner_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('challenge_participants')
          .select('challenge_id')
          .eq('user_id', user.id)
          .eq('status', 'active'),
      ]);

      const ownedChallenges = ownedResult.data || [];
      const participatedIds = participationsResult.data?.map(p => p.challenge_id) || [];

      // Combine owned and participated challenges
      const allChallengeIds = [
        ...ownedChallenges.map(c => c.id),
        ...participatedIds,
      ];
      const uniqueChallengeIds = Array.from(new Set(allChallengeIds));

      if (uniqueChallengeIds.length === 0) return [];

      const today = getTodayDateString();

      // PARALLEL: Get challenges, participants, and today's entries all at once
      const [challengesResult, participantsResult, entriesResult] = await Promise.all([
        supabase
          .from('challenges')
          .select('*')
          .in('id', uniqueChallengeIds)
          .eq('status', 'active'),
        supabase
          .from('challenge_participants')
          .select(`
            *,
            profile:profiles(*)
          `)
          .in('challenge_id', uniqueChallengeIds)
          .eq('status', 'active'),
        supabase
          .from('daily_entries')
          .select('*')
          .in('challenge_id', uniqueChallengeIds)
          .eq('entry_date', today),
      ]);

      const challenges = challengesResult.data;
      const allParticipants = participantsResult.data;
      const todayEntries = entriesResult.data;

      if (!challenges || challenges.length === 0) return [];

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
      const today = getTodayDateString();

      // PARALLEL: Get user, challenge, participants, and entries all at once
      const [userResult, challengeResult, participantsResult, entriesResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('challenges')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('challenge_participants')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('challenge_id', id)
          .eq('status', 'active'),
        supabase
          .from('daily_entries')
          .select('*')
          .eq('challenge_id', id)
          .eq('entry_date', today),
      ]);

      const user = userResult.data.user;
      if (!user) throw new Error('Not authenticated');

      const challenge = challengeResult.data;
      if (challengeResult.error) throw challengeResult.error;

      const participants = participantsResult.data;
      const todayEntries = entriesResult.data;

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[useJoinChallenge] User:', user?.id, 'Auth error:', authError);
      if (!user) throw new Error('Not authenticated');

      // Find challenge by invite code
      const normalizedCode = inviteCode.toUpperCase();
      console.log('[useJoinChallenge] Looking for invite code:', normalizedCode);

      const { data: challenge, error: findError } = await supabase
        .from('challenges')
        .select('*')
        .eq('invite_code', normalizedCode)
        .eq('status', 'active')
        .single();

      console.log('[useJoinChallenge] Challenge found:', challenge, 'Error:', findError);

      if (findError || !challenge) {
        throw new Error(`Invalid invite code. Error: ${findError?.message || 'Not found'}`);
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
