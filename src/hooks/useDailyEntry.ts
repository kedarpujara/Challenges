'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DailyEntry, MetricEntry, Metric } from '@/types';
import { getTodayDateString, getDayNumber } from '@/lib/utils';

export function useDailyEntry(challengeId: string, participantId: string | undefined) {
  const supabase = createClient();
  const today = getTodayDateString();

  return useQuery({
    queryKey: ['daily-entry', challengeId, participantId, today],
    queryFn: async () => {
      if (!participantId) return null;

      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('participant_id', participantId)
        .eq('entry_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as DailyEntry | null;
    },
    enabled: !!participantId,
  });
}

export function useUpdateDailyEntry(challengeId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      participantId,
      startDate,
      metricsData,
      metrics,
      photoUrl,
    }: {
      participantId: string;
      startDate: string;
      metricsData: Record<string, MetricEntry>;
      metrics: Metric[];
      photoUrl?: string;
    }) => {
      const today = getTodayDateString();
      const dayNumber = getDayNumber(startDate, today);

      // Calculate pass/fail counts
      const requiredMetrics = metrics.filter(m => m.required && !m.tracking);
      let passCount = 0;
      let failCount = 0;

      requiredMetrics.forEach(metric => {
        const entry = metricsData[metric.id];
        if (entry?.status === 'pass') {
          passCount++;
        } else if (entry?.status === 'fail') {
          failCount++;
        }
      });

      const isComplete = passCount + failCount === requiredMetrics.length;

      // Upsert entry
      const { data, error } = await supabase
        .from('daily_entries')
        .upsert({
          challenge_id: challengeId,
          participant_id: participantId,
          entry_date: today,
          day_number: dayNumber,
          metrics_data: metricsData,
          pass_count: passCount,
          fail_count: failCount,
          is_complete: isComplete,
          photo_url: photoUrl,
        }, {
          onConflict: 'participant_id,entry_date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['daily-entry', challengeId, variables.participantId],
      });
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useChallengeEntries(challengeId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['challenge-entries', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_entries')
        .select(`
          *,
          participant:challenge_participants(
            *,
            profile:profiles(*)
          )
        `)
        .eq('challenge_id', challengeId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!challengeId,
  });
}
