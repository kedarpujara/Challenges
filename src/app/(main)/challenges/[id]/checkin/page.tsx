'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Camera, Loader2 } from 'lucide-react';
import { Button, Card, Input, SegmentedProgress } from '@/components/ui';
import { useChallenge } from '@/hooks/useChallenge';
import { useDailyEntry, useUpdateDailyEntry } from '@/hooks/useDailyEntry';
import { evaluateMetric } from '@/lib/utils';
import type { Metric, MetricEntry, MetricStatus } from '@/types';

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: challenge, isLoading: challengeLoading } = useChallenge(id);
  const participantId = challenge?.my_participant?.id;

  const { data: existingEntry } = useDailyEntry(id, participantId);
  const updateEntry = useUpdateDailyEntry(id);

  const [metricsData, setMetricsData] = useState<Record<string, MetricEntry>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from existing entry
  useEffect(() => {
    if (existingEntry?.metrics_data) {
      setMetricsData(existingEntry.metrics_data as Record<string, MetricEntry>);
    }
  }, [existingEntry]);

  if (challengeLoading || !challenge) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const metrics = challenge.metrics as Metric[];
  const requiredMetrics = metrics.filter(m => m.required && !m.tracking);

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
      });
      router.push(`/challenges/${id}`);
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
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
        {metrics.map(metric => (
          <MetricInput
            key={metric.id}
            metric={metric}
            entry={metricsData[metric.id]}
            onStatusChange={(status) => handleStatusChange(metric.id, status)}
            onValueChange={(value) => handleValueChange(metric, value)}
            onCountChange={(value) => handleCountChange(metric.id, value)}
          />
        ))}
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
}

function MetricInput({ metric, entry, onStatusChange, onValueChange, onCountChange }: MetricInputProps) {
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

  // Number metrics
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
            <div>
              <p className="font-medium">{metric.name}</p>
              <p className="text-xs text-muted-foreground">Target: {targetText} {metric.unit}</p>
            </div>
            <StatusIndicator status={status} />
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={`Enter ${metric.unit || 'value'}`}
              value={value || ''}
              onChange={(e) => onValueChange(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
      </Card>
    );
  }

  // Photo metrics
  if (metric.type === 'photo') {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{metric.name}</p>
            {!metric.required && <p className="text-xs text-muted-foreground">Optional</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"
              onClick={() => {/* TODO: Implement photo upload */}}
            >
              <Camera className="w-5 h-5 text-muted-foreground" />
            </button>
            <PassFailButtons
              status={status}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
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

function StatusIndicator({ status }: { status: MetricStatus }) {
  if (status === 'pass') {
    return (
      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
        <Check className="w-5 h-5 text-success" />
      </div>
    );
  }
  if (status === 'fail') {
    return (
      <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
        <X className="w-5 h-5 text-destructive" />
      </div>
    );
  }
  return null;
}
