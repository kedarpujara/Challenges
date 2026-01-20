'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Flame,
  Star,
  Target,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Footprints,
  Droplets,
  Dumbbell,
  Clock,
  Camera,
  Wine,
  Smartphone,
  BookOpen,
  Moon,
  Utensils,
  Heart,
  Zap,
  Check,
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useCreateChallenge } from '@/hooks/useChallenge';
import { METRICS_75_HARD, METRICS_75_SOFT, METRICS_30_DAY } from '@/lib/constants';
import type { Metric } from '@/types';

type Step = 'template' | 'customize' | 'metrics';

const METRIC_ICONS: Record<string, React.ReactNode> = {
  steps: <Footprints className="w-5 h-5" />,
  water: <Droplets className="w-5 h-5" />,
  workout: <Dumbbell className="w-5 h-5" />,
  screen_time: <Smartphone className="w-5 h-5" />,
  photo: <Camera className="w-5 h-5" />,
  alcohol: <Wine className="w-5 h-5" />,
  reading: <BookOpen className="w-5 h-5" />,
  sleep: <Moon className="w-5 h-5" />,
  diet: <Utensils className="w-5 h-5" />,
  meditation: <Heart className="w-5 h-5" />,
  energy: <Zap className="w-5 h-5" />,
  pickups: <Smartphone className="w-5 h-5" />,
  default: <Target className="w-5 h-5" />,
};

const AVAILABLE_ICONS = [
  { id: 'steps', icon: <Footprints className="w-5 h-5" />, label: 'Steps' },
  { id: 'water', icon: <Droplets className="w-5 h-5" />, label: 'Water' },
  { id: 'workout', icon: <Dumbbell className="w-5 h-5" />, label: 'Workout' },
  { id: 'screen', icon: <Smartphone className="w-5 h-5" />, label: 'Screen' },
  { id: 'photo', icon: <Camera className="w-5 h-5" />, label: 'Photo' },
  { id: 'alcohol', icon: <Wine className="w-5 h-5" />, label: 'Alcohol' },
  { id: 'reading', icon: <BookOpen className="w-5 h-5" />, label: 'Reading' },
  { id: 'sleep', icon: <Moon className="w-5 h-5" />, label: 'Sleep' },
  { id: 'diet', icon: <Utensils className="w-5 h-5" />, label: 'Diet' },
  { id: 'meditation', icon: <Heart className="w-5 h-5" />, label: 'Mindful' },
  { id: 'energy', icon: <Zap className="w-5 h-5" />, label: 'Energy' },
  { id: 'target', icon: <Target className="w-5 h-5" />, label: 'Goal' },
  { id: 'clock', icon: <Clock className="w-5 h-5" />, label: 'Time' },
  { id: 'check', icon: <Check className="w-5 h-5" />, label: 'Check' },
];

const templates = [
  {
    key: '75_hard',
    name: '75 Hard',
    description: 'The ultimate mental toughness program',
    icon: <Flame className="w-6 h-6" />,
    duration: 75,
    difficulty: 'Extreme',
    color: 'text-orange-500',
    metrics: METRICS_75_HARD,
  },
  {
    key: '75_soft',
    name: '75 Soft',
    description: 'A gentler version with flexibility',
    icon: <Star className="w-6 h-6" />,
    duration: 75,
    difficulty: 'Hard',
    color: 'text-yellow-500',
    metrics: METRICS_75_SOFT,
  },
  {
    key: '30_day',
    name: '30 Day Challenge',
    description: 'Build a new habit in 30 days',
    icon: <Target className="w-6 h-6" />,
    duration: 30,
    difficulty: 'Medium',
    color: 'text-emerald-500',
    metrics: METRICS_30_DAY,
  },
  {
    key: 'custom',
    name: 'Custom Challenge',
    description: 'Build your own from scratch',
    icon: <Plus className="w-6 h-6" />,
    duration: 30,
    difficulty: 'Custom',
    color: 'text-accent',
    metrics: [],
  },
];

function getMetricIcon(metricId: string): React.ReactNode {
  return METRIC_ICONS[metricId] || METRIC_ICONS.default;
}

export default function CreateChallengePage() {
  const router = useRouter();
  const createChallenge = useCreateChallenge();

  const [step, setStep] = useState<Step>('template');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Combined loading state - true during mutation OR during navigation
  const isLoading = createChallenge.isPending || isNavigating;

  const handleSelectTemplate = (key: string) => {
    const template = templates.find(t => t.key === key);
    if (!template) return;

    setName(key === 'custom' ? '' : template.name);
    setDuration(template.duration);
    setMetrics([...template.metrics]);
    setStep('customize');
  };

  const handleAddMetric = () => {
    const newMetric: Metric = {
      id: `custom_${Date.now()}`,
      name: 'New Metric',
      type: 'boolean',
      required: true,
      icon: 'target',
    };
    setMetrics([...metrics, newMetric]);
    setExpandedMetric(newMetric.id);
  };

  const handleUpdateMetric = (id: string, updates: Partial<Metric>) => {
    setMetrics(metrics.map(m =>
      m.id === id ? { ...m, ...updates } : m
    ));
  };

  const handleRemoveMetric = (id: string) => {
    setMetrics(metrics.filter(m => m.id !== id));
    if (expandedMetric === id) setExpandedMetric(null);
  };

  const handleCreate = async () => {
    if (!name) {
      setError('Please enter a challenge name');
      return;
    }
    if (metrics.length === 0) {
      setError('Please add at least one metric');
      return;
    }

    setError(null);
    console.log('Creating challenge with:', { name, startDate, duration, metrics: metrics.length });

    try {
      const challenge = await createChallenge.mutateAsync({
        name,
        start_date: startDate,
        duration_days: duration,
        metrics,
        visibility: 'friends',
      });

      console.log('Challenge created:', challenge);

      if (!challenge || !challenge.id) {
        setError('Challenge created but no ID returned');
        return;
      }

      // Keep loading state while navigating
      setIsNavigating(true);
      router.push(`/challenges/${challenge.id}`);
    } catch (err: unknown) {
      console.error('Failed to create challenge:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create challenge';
      setError(errorMessage);
    }
  };

  const renderMetricEditor = (metric: Metric) => {
    const isExpanded = expandedMetric === metric.id;

    return (
      <Card key={metric.id} className="overflow-hidden">
        <div
          className="p-3 flex items-center gap-3 cursor-pointer"
          onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
        >
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            {getMetricIcon(metric.icon || metric.id)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{metric.name}</div>
            <div className="text-xs text-muted-foreground">
              {metric.type === 'boolean' && 'Yes/No'}
              {metric.type === 'number' && `Target: ${metric.target} ${metric.unit || ''}`}
              {metric.type === 'count' && 'Count tracker'}
              {metric.type === 'photo' && 'Photo upload'}
              {metric.tracking ? ' (Tracking only)' : metric.required ? ' (Required)' : ' (Optional)'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveMetric(metric.id);
              }}
              className="p-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 pt-0 space-y-3 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <Input
                value={metric.name}
                onChange={(e) => handleUpdateMetric(metric.id, { name: e.target.value })}
                placeholder="Metric name"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={metric.type}
                onChange={(e) => handleUpdateMetric(metric.id, {
                  type: e.target.value as Metric['type'],
                  target: e.target.value === 'number' ? 10 : undefined,
                  comparison: e.target.value === 'number' ? 'gte' : undefined,
                })}
                className="w-full h-10 rounded-lg border border-border bg-card px-3"
              >
                <option value="boolean">Yes/No (Pass/Fail)</option>
                <option value="number">Number with Target</option>
                <option value="count">Counter (Track only)</option>
                <option value="photo">Photo Upload</option>
              </select>
            </div>

            {metric.type === 'number' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Target</label>
                    <Input
                      type="number"
                      value={metric.target || 0}
                      onChange={(e) => handleUpdateMetric(metric.id, {
                        target: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <Input
                      value={metric.unit || ''}
                      onChange={(e) => handleUpdateMetric(metric.id, { unit: e.target.value })}
                      placeholder="e.g., steps, mins"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Condition</label>
                  <select
                    value={metric.comparison || 'gte'}
                    onChange={(e) => handleUpdateMetric(metric.id, {
                      comparison: e.target.value as Metric['comparison']
                    })}
                    className="w-full h-10 rounded-lg border border-border bg-card px-3"
                  >
                    <option value="gte">At least (greater than or equal)</option>
                    <option value="lte">At most (less than or equal)</option>
                    <option value="eq">Exactly equal to</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {metric.tracking ? 'Tracking Only' : metric.required ? 'Required' : 'Optional'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.tracking
                    ? "Won't affect pass/fail"
                    : metric.required
                      ? 'Must complete daily'
                      : 'Optional to complete'}
                </div>
              </div>
              <select
                value={metric.tracking ? 'tracking' : metric.required ? 'required' : 'optional'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateMetric(metric.id, {
                    required: val === 'required',
                    tracking: val === 'tracking',
                  });
                }}
                className="h-10 rounded-lg border border-border bg-card px-3"
              >
                <option value="required">Required</option>
                <option value="optional">Optional</option>
                <option value="tracking">Tracking Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map(({ id, icon }) => (
                  <button
                    key={id}
                    onClick={() => handleUpdateMetric(metric.id, { icon: id })}
                    className={`p-2 rounded-lg border ${
                      (metric.icon || metric.id) === id
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 'template') router.back();
              else if (step === 'metrics') setStep('customize');
              else setStep('template');
            }}
            className="tap-target"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">Create Challenge</h1>
            <p className="text-sm text-muted-foreground">
              {step === 'template' && 'Choose a template'}
              {step === 'customize' && 'Customize your challenge'}
              {step === 'metrics' && 'Edit metrics'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Template Selection */}
      {step === 'template' && (
        <div className="p-4 space-y-4">
          <p className="text-muted-foreground">
            Select a challenge template or create your own
          </p>

          {templates.map(template => (
            <Card
              key={template.key}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSelectTemplate(template.key)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-muted ${template.color}`}>
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="bg-muted px-2 py-1 rounded">
                      {template.duration} days
                    </span>
                    <span className="bg-muted px-2 py-1 rounded">
                      {template.difficulty}
                    </span>
                    {template.metrics.length > 0 && (
                      <span className="bg-muted px-2 py-1 rounded">
                        {template.metrics.length} metrics
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Customize */}
      {step === 'customize' && (
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <label className="label">Challenge Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Challenge"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Duration (days)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                min={1}
                max={365}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Metrics Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label">Metrics ({metrics.length})</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('metrics')}
              >
                Edit All
              </Button>
            </div>

            {metrics.length === 0 ? (
              <Card className="p-6 text-center">
                <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  No metrics yet. Add what you want to track.
                </p>
                <Button variant="outline" onClick={() => setStep('metrics')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Metrics
                </Button>
              </Card>
            ) : (
              <Card className="divide-y divide-border">
                {metrics.slice(0, 5).map(metric => (
                  <div key={metric.id} className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      {getMetricIcon(metric.icon || metric.id)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{metric.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {metric.tracking ? 'Tracking' : metric.required ? 'Required' : 'Optional'}
                      </div>
                    </div>
                  </div>
                ))}
                {metrics.length > 5 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    +{metrics.length - 5} more metrics
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <Button
              className="w-full"
              onClick={handleCreate}
              isLoading={isLoading}
              disabled={!name || metrics.length === 0 || isLoading}
            >
              {isNavigating ? 'Opening challenge...' : 'Create Challenge'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setStep('metrics')}
            >
              Edit Metrics
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Editor */}
      {step === 'metrics' && (
        <div className="p-4 space-y-4">
          <p className="text-muted-foreground text-sm">
            Add, remove, or customize your daily metrics
          </p>

          <div className="space-y-3">
            {metrics.map(metric => renderMetricEditor(metric))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddMetric}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Metric
          </Button>

          <Button
            className="w-full"
            onClick={() => setStep('customize')}
          >
            Done ({metrics.length} metrics)
          </Button>
        </div>
      )}
    </div>
  );
}
