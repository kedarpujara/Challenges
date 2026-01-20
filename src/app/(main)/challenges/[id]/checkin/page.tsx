'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, Input, SegmentedProgress, PhotoUpload } from '@/components/ui';
import { useChallenge } from '@/hooks/useChallenge';
import { useDailyEntry, useUpdateDailyEntry } from '@/hooks/useDailyEntry';
import { evaluateMetric, getTodayDateString, getDayNumber, getDateForDay } from '@/lib/utils';
import type { Metric, MetricEntry, MetricStatus } from '@/types';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: challenge, isLoading: challengeLoading } = useChallenge(id);
  const participantId = challenge?.my_participant?.id;

  // Selected date state - defaults to today
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const { data: existingEntry, isLoading: entryLoading } = useDailyEntry(id, participantId, selectedDate);
  const updateEntry = useUpdateDailyEntry(id);

  const [metricsData, setMetricsData] = useState<Record<string, MetricEntry>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from existing entry or clear when date changes
  useEffect(() => {
    if (existingEntry?.metrics_data) {
      setMetricsData(existingEntry.metrics_data as Record<string, MetricEntry>);
      setPhotoUrl(existingEntry.photo_url);
    } else {
      // Clear metrics when no entry exists for selected date
      setMetricsData({});
      setPhotoUrl(null);
    }
  }, [existingEntry, selectedDate]);

  if (challengeLoading || !challenge) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const metrics = challenge.metrics as Metric[];
  const requiredMetrics = metrics.filter(m => m.required && !m.tracking);

  // Date navigation helpers
  const today = getTodayDateString();
  const currentDayNumber = getDayNumber(challenge.start_date, selectedDate);
  const isToday = selectedDate === today;
  const isFirstDay = currentDayNumber <= 1;
  const isLastDay = currentDayNumber >= challenge.duration_days || selectedDate >= today;

  const goToPreviousDay = () => {
    if (isFirstDay) return;
    setSelectedDate(getDateForDay(challenge.start_date, currentDayNumber - 1));
  };

  const goToNextDay = () => {
    if (isLastDay) return;
    setSelectedDate(getDateForDay(challenge.start_date, currentDayNumber + 1));
  };

  const goToToday = () => {
    setSelectedDate(today);
  };

  // Format selected date for display
  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate counts
  let passCount = 0;
  let failCount = 0;
  requiredMetrics.forEach(metric => {
    const entry = metricsData[metric.id];
    if (entry?.status === 'pass') passCount++;
    else if (entry?.status === 'fail') failCount++;
  });
  const pendingCount = requiredMetrics.length - passCount - failCount;

  const handleStatusChange = (metricId: string, status: MetricStatus) => {
    setMetricsData(prev => {
      const current = prev[metricId];
      // Toggle off if same status
      if (current?.status === status) {
        return {
          ...prev,
          [metricId]: { ...current, status: 'pending' },
        };
      }
      return {
        ...prev,
        [metricId]: { ...current, status },
      };
    });
  };

  const handleValueChange = (metric: Metric, value: number) => {
    const passes = evaluateMetric(metric.type, value, metric.target, metric.comparison);
    setMetricsData(prev => ({
      ...prev,
      [metric.id]: {
        status: passes ? 'pass' : 'fail',
        value,
      },
    }));
  };

  const handleCountChange = (metricId: string, value: number) => {
    setMetricsData(prev => ({
      ...prev,
      [metricId]: {
        status: 'pass', // Count metrics always pass
        value: Math.max(0, value),
      },
    }));
  };

  const handleSave = async () => {
    if (!participantId) return;

    setIsSaving(true);
    try {
      await updateEntry.mutateAsync({
        participantId,
        startDate: challenge.start_date,
        metricsData,
        metrics,
        entryDate: selectedDate,
        photoUrl: photoUrl || undefined,
      });
      // Keep loading while navigating - don't reset isSaving on success
      router.push('/checkin');
    } catch (error) {
      console.error('Failed to save entry:', error);
      // Only reset loading on error
      setIsSaving(false);
    }
  };

  const isComplete = pendingCount === 0;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">Daily Check-in</h1>
            <p className="text-sm text-muted-foreground">{challenge.name}</p>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            disabled={isFirstDay}
            className={`p-2 rounded-lg ${isFirstDay ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="font-semibold">Day {currentDayNumber}</div>
            <div className="text-sm text-muted-foreground">
              {formatDisplayDate(selectedDate)}
              {isToday && <span className="text-accent ml-1">(Today)</span>}
            </div>
          </div>

          <button
            onClick={goToNextDay}
            disabled={isLastDay}
            className={`p-2 rounded-lg ${isLastDay ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {!isToday && (
          <button
            onClick={goToToday}
            className="mt-2 w-full text-sm text-accent hover:underline"
          >
            Go to today
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-border">
        <SegmentedProgress
          segments={[
            { value: passCount, color: 'bg-success' },
            { value: failCount, color: 'bg-destructive' },
            { value: pendingCount, color: 'bg-muted' },
          ]}
          total={requiredMetrics.length}
          className="mb-2"
        />
        <div className="flex justify-between text-sm">
          <span className="text-success">{passCount} passed</span>
          <span className="text-destructive">{failCount} failed</span>
          <span className="text-muted-foreground">{pendingCount} pending</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-4">
        {entryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : (
          metrics.map(metric => (
            <MetricInput
              key={metric.id}
              metric={metric}
              entry={metricsData[metric.id]}
              onStatusChange={(status) => handleStatusChange(metric.id, status)}
              onValueChange={(value) => handleValueChange(metric, value)}
              onCountChange={(value) => handleCountChange(metric.id, value)}
              challengeId={id}
              entryDate={selectedDate}
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
            />
          ))
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full"
            onClick={handleSave}
            isLoading={isSaving}
          >
            {isComplete
              ? `Done (${passCount} passed, ${failCount} failed)`
              : `Save (${pendingCount} pending)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MetricInputProps {
  metric: Metric;
  entry?: MetricEntry;
  onStatusChange: (status: MetricStatus) => void;
  onValueChange: (value: number) => void;
  onCountChange: (value: number) => void;
  challengeId: string;
  entryDate: string;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
}

function MetricInput({ metric, entry, onStatusChange, onValueChange, onCountChange, challengeId, entryDate, photoUrl, onPhotoChange }: MetricInputProps) {
  const status = entry?.status || 'pending';
  const value = entry?.value;

  // Count metrics (tracking only)
  if (metric.tracking) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{metric.name}</p>
            <p className="text-xs text-muted-foreground">Tracking only</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
              onClick={() => onCountChange((value || 0) - 1)}
            >
              <span className="text-lg">-</span>
            </button>
            <span className="w-8 text-center font-semibold">{value || 0}</span>
            <button
              className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
              onClick={() => onCountChange((value || 0) + 1)}
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Number metrics - with quick pass/fail buttons and optional value entry
  if (metric.type === 'number') {
    const targetText = metric.comparison === 'lte'
      ? `< ${metric.target}`
      : metric.comparison === 'gte'
      ? `≥ ${metric.target}`
      : `= ${metric.target}`;

    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">{metric.name}</p>
              <p className="text-xs text-muted-foreground">
                Target: {targetText} {metric.unit}
                {!metric.required && ' • Optional'}
              </p>
            </div>
            <PassFailButtons
              status={status}
              onStatusChange={onStatusChange}
            />
          </div>
          <Input
            type="number"
            placeholder={`Enter ${metric.unit || 'value'} (optional)`}
            value={value ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                // Clear value but keep current status
                return;
              }
              onValueChange(Number(val));
            }}
            className="text-sm"
          />
        </div>
      </Card>
    );
  }

  // Photo metrics
  if (metric.type === 'photo') {
    const handlePhotoChange = (url: string | null) => {
      onPhotoChange(url);
      // Auto-set status based on photo presence
      if (url) {
        onStatusChange('pass');
      } else {
        onStatusChange('pending');
      }
    };

    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{metric.name}</p>
            {!metric.required && <p className="text-xs text-muted-foreground">Optional</p>}
          </div>
          {!photoUrl && (
            <PassFailButtons
              status={status}
              onStatusChange={onStatusChange}
            />
          )}
        </div>
        <PhotoUpload
          value={photoUrl}
          onChange={handlePhotoChange}
          challengeId={challengeId}
          entryDate={entryDate}
        />
      </Card>
    );
  }

  // Boolean metrics
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{metric.name}</p>
          {!metric.required && <p className="text-xs text-muted-foreground">Optional</p>}
        </div>
        <PassFailButtons
          status={status}
          onStatusChange={onStatusChange}
        />
      </div>
    </Card>
  );
}

function PassFailButtons({
  status,
  onStatusChange,
}: {
  status: MetricStatus;
  onStatusChange: (status: MetricStatus) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
          status === 'pass'
            ? 'bg-success text-white'
            : 'bg-muted text-muted-foreground hover:bg-success/20'
        }`}
        onClick={() => onStatusChange('pass')}
      >
        <Check className="w-6 h-6" />
      </button>
      <button
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
          status === 'fail'
            ? 'bg-destructive text-white'
            : 'bg-muted text-muted-foreground hover:bg-destructive/20'
        }`}
        onClick={() => onStatusChange('fail')}
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

