'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button, Card, Tabs, TabContent, Avatar, SegmentedProgress, Modal } from '@/components/ui';
import { useChallenge } from '@/hooks/useChallenge';
import { useChallengeEntries } from '@/hooks/useDailyEntry';
import { getDayNumber, getStreakEmoji, getTodayDateString } from '@/lib/utils';
import type { Metric, MetricEntry, ChallengeWithParticipants, DailyEntry, ChallengeParticipant } from '@/types';

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: challenge, isLoading, error } = useChallenge(id);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">Challenge not found</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const dayNumber = getDayNumber(challenge.start_date);
  const todayEntry = challenge.today_entry;
  const metrics = challenge.metrics as Metric[];
  const requiredMetrics = metrics.filter(m => m.required && !m.tracking);
  const passCount = todayEntry?.pass_count || 0;
  const failCount = todayEntry?.fail_count || 0;
  const pendingCount = requiredMetrics.length - passCount - failCount;

  const tabs = [
    { value: 'today', label: 'Today', icon: <Calendar className="w-4 h-4" /> },
    { value: 'people', label: 'People', icon: <Users className="w-4 h-4" /> },
    { value: 'photos', label: 'Photos', icon: <ImageIcon className="w-4 h-4" /> },
    { value: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="tap-target">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold truncate">{challenge.name}</h1>
            <p className="text-sm text-muted-foreground">Day {dayNumber} of {challenge.duration_days}</p>
          </div>
          <button className="tap-target" onClick={() => setShowInviteModal(true)}>
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Today&apos;s Progress</span>
            <Link href={`/challenges/${id}/checkin`}>
              <Button size="sm">Check In</Button>
            </Link>
          </div>

          <SegmentedProgress
            segments={[
              { value: passCount, color: 'bg-success' },
              { value: failCount, color: 'bg-destructive' },
              { value: pendingCount, color: 'bg-muted' },
            ]}
            total={requiredMetrics.length}
            className="mb-3"
          />

          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1 text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>{passCount} passed</span>
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <XCircle className="w-4 h-4" />
              <span>{failCount} failed</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{pendingCount} pending</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} tabs={tabs} />

      {/* Tab Content */}
      <div className="p-4">
        <TabContent value="today" activeValue={activeTab}>
          <TodayTab challenge={challenge} todayEntry={todayEntry} />
        </TabContent>

        <TabContent value="people" activeValue={activeTab}>
          <PeopleTab challenge={challenge} onInvite={() => setShowInviteModal(true)} />
        </TabContent>

        <TabContent value="photos" activeValue={activeTab}>
          <PhotosTab challenge={challenge} />
        </TabContent>

        <TabContent value="stats" activeValue={activeTab}>
          <StatsTab challenge={challenge} />
        </TabContent>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteCode={challenge.invite_code}
        challengeName={challenge.name}
      />
    </div>
  );
}

function TodayTab({ challenge, todayEntry }: { challenge: ChallengeWithParticipants; todayEntry: DailyEntry | undefined }) {
  const metrics = challenge.metrics as Metric[];
  const metricsData = (todayEntry?.metrics_data || {}) as Record<string, MetricEntry>;

  return (
    <div className="space-y-3">
      {metrics.map(metric => {
        const entry = metricsData[metric.id];
        const status = entry?.status || 'pending';

        return (
          <Card key={metric.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{metric.name}</p>
                {metric.type === 'number' && entry?.value !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {entry.value} {metric.unit}
                  </p>
                )}
                {!metric.required && (
                  <p className="text-xs text-muted-foreground">Optional</p>
                )}
              </div>
              <div>
                {status === 'pass' && (
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                )}
                {status === 'fail' && (
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                )}
                {status === 'pending' && (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      <div className="pt-4">
        <Link href={`/challenges/${challenge.id}/checkin`}>
          <Button className="w-full">
            {todayEntry ? 'Update Check-in' : 'Check In Now'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PeopleTab({ challenge, onInvite }: { challenge: ChallengeWithParticipants; onInvite: () => void }) {
  const today = getTodayDateString();
  const { data: allEntries } = useChallengeEntries(challenge.id);
  const metrics = challenge.metrics as Metric[];
  const requiredMetrics = metrics.filter(m => m.required && !m.tracking);

  // Get today's entries for all participants
  const todayEntriesByParticipant = useMemo(() => {
    const map: Record<string, DailyEntry> = {};
    allEntries?.forEach(entry => {
      if (entry.entry_date === today) {
        map[entry.participant_id] = entry as DailyEntry;
      }
    });
    return map;
  }, [allEntries, today]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{challenge.participants.length} Participants</h3>
        <Button size="sm" variant="outline" onClick={onInvite}>Invite</Button>
      </div>

      <div className="space-y-3">
        {challenge.participants.map((participant: ChallengeParticipant) => {
          const name = participant.is_bot
            ? participant.bot_name
            : participant.profile?.display_name || participant.profile?.username || 'User';
          const streak = participant.current_streak;
          const streakEmoji = getStreakEmoji(streak);

          // Get today's entry for this participant
          const todayEntry = todayEntriesByParticipant[participant.id];
          const metricsData = (todayEntry?.metrics_data || {}) as Record<string, MetricEntry>;

          // Calculate pass/fail for today
          let passCount = 0;
          let failCount = 0;
          requiredMetrics.forEach(metric => {
            const entry = metricsData[metric.id];
            if (entry?.status === 'pass') passCount++;
            else if (entry?.status === 'fail') failCount++;
          });
          const pendingCount = requiredMetrics.length - passCount - failCount;
          const hasCheckedIn = passCount > 0 || failCount > 0;

          return (
            <Card key={participant.id} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={participant.is_bot ? null : participant.profile?.avatar_url}
                  alt={name || undefined}
                  size="md"
                  fallback={participant.is_bot ? (
                    <span className="text-lg">{participant.bot_avatar || '🤖'}</span>
                  ) : undefined}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{name}</p>
                    {participant.is_bot && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">Bot</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {participant.days_completed} days completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {streakEmoji && <span>{streakEmoji}</span>}
                    <span className="font-semibold">{streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">streak</p>
                </div>
              </div>

              {/* Today's progress */}
              <div className="pt-2 border-t border-border">
                {hasCheckedIn ? (
                  <>
                    <SegmentedProgress
                      segments={[
                        { value: passCount, color: 'bg-success' },
                        { value: failCount, color: 'bg-destructive' },
                        { value: pendingCount, color: 'bg-muted' },
                      ]}
                      total={requiredMetrics.length}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-success">{passCount} passed</span>
                      <span className="text-destructive">{failCount} failed</span>
                      {pendingCount > 0 && (
                        <span className="text-muted-foreground">{pendingCount} pending</span>
                      )}
                    </div>

                    {/* Show which metrics passed/failed */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {requiredMetrics.map(metric => {
                        const entry = metricsData[metric.id];
                        const status = entry?.status || 'pending';
                        return (
                          <span
                            key={metric.id}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              status === 'pass'
                                ? 'bg-success/20 text-success'
                                : status === 'fail'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {metric.name}
                          </span>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-1">
                    No check-in today
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Colors for different participants
const PARTICIPANT_COLORS = [
  '#f97316', // orange (you)
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#6366f1', // indigo
];

function StatsTab({ challenge }: { challenge: ChallengeWithParticipants }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { data: allEntries, isLoading } = useChallengeEntries(challenge.id);

  const metrics = challenge.metrics as Metric[];
  const requiredMetrics = metrics.filter(m => m.required && !m.tracking);
  const myParticipantId = challenge.my_participant?.id;
  const currentDay = getDayNumber(challenge.start_date);

  // Build participant info map
  const participantInfo = useMemo(() => {
    const info: Record<string, { name: string; color: string; isMe: boolean }> = {};
    let colorIndex = 1; // Start at 1, 0 is reserved for "You"

    challenge.participants.forEach((p: ChallengeParticipant) => {
      const isMe = p.id === myParticipantId;
      const name = p.is_bot
        ? p.bot_name || 'Bot'
        : p.profile?.display_name || p.profile?.username || 'User';

      info[p.id] = {
        name: isMe ? 'You' : name,
        color: isMe ? PARTICIPANT_COLORS[0] : PARTICIPANT_COLORS[colorIndex % PARTICIPANT_COLORS.length],
        isMe,
      };
      if (!isMe) colorIndex++;
    });

    return info;
  }, [challenge.participants, myParticipantId]);

  // Process entries into chart data with individual participant data
  const chartData = useMemo(() => {
    if (!allEntries) return [];

    const totalMetrics = requiredMetrics.length;

    // Build a map of participant entries by day
    const entryMap: Record<string, Record<number, { passCount: number }>> = {};

    allEntries.forEach(entry => {
      const participantId = entry.participant_id;

      if (!entryMap[participantId]) {
        entryMap[participantId] = {};
      }

      entryMap[participantId][entry.day_number] = {
        passCount: entry.pass_count,
      };
    });

    // Generate data for all days from 1 to current day
    const data = [];
    for (let day = 1; day <= currentDay; day++) {
      const dayData: Record<string, number | string> = { day, totalMetrics };

      // Add each participant's completion
      Object.keys(participantInfo).forEach(pid => {
        const passCount = entryMap[pid]?.[day]?.passCount || 0;
        const completion = totalMetrics > 0 ? Math.round((passCount / totalMetrics) * 100) : 0;
        dayData[`completion_${pid}`] = completion;
        dayData[`passCount_${pid}`] = passCount;
      });

      data.push(dayData);
    }

    return data;
  }, [allEntries, participantInfo, requiredMetrics.length, currentDay]);

  // Process per-metric data with individual participant data
  const metricChartData = useMemo(() => {
    if (!allEntries || !selectedMetric) return [];

    // Build a map of metric status by participant and day
    const metricMap: Record<string, Record<number, boolean>> = {};

    allEntries.forEach(entry => {
      const participantId = entry.participant_id;
      const metricsData = entry.metrics_data as Record<string, MetricEntry>;
      const metricEntry = metricsData[selectedMetric];

      if (!metricMap[participantId]) {
        metricMap[participantId] = {};
      }

      metricMap[participantId][entry.day_number] = metricEntry?.status === 'pass';
    });

    // Generate data for all days from 1 to current day
    const data = [];
    for (let day = 1; day <= currentDay; day++) {
      const dayData: Record<string, number | string> = { day };

      // Add each participant's status (100 = pass, 0 = fail)
      Object.keys(participantInfo).forEach(pid => {
        const passed = metricMap[pid]?.[day] === true;
        dayData[`status_${pid}`] = passed ? 100 : 0;
      });

      data.push(dayData);
    }

    return data;
  }, [allEntries, selectedMetric, participantInfo, currentDay]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!allEntries || allEntries.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No data yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Check in to see your stats
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setShowAll(false)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              !showAll ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Just Me
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              showAll ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Everyone
          </button>
        </div>
      </div>

      {/* Overall Completion Chart */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Daily Completion</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                stroke="#666"
                label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#666' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={(v) => `${v}%`}
                width={45}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value, name, props) => {
                  const entry = props.payload;
                  // Find the participant ID from the dataKey
                  const pid = Object.keys(participantInfo).find(
                    id => participantInfo[id].name === name
                  );
                  if (pid) {
                    const passCount = entry[`passCount_${pid}`] || 0;
                    return [`${passCount}/${entry.totalMetrics} (${value}%)`, name];
                  }
                  return [`${value}%`, name];
                }}
                labelFormatter={(day) => `Day ${day}`}
              />
              <Legend />
              {Object.entries(participantInfo).map(([pid, info]) => {
                // Always show "You", only show others when showAll is true
                if (!info.isMe && !showAll) return null;
                return (
                  <Line
                    key={pid}
                    type="monotone"
                    dataKey={`completion_${pid}`}
                    name={info.name}
                    stroke={info.color}
                    strokeWidth={info.isMe ? 3 : 2}
                    dot={{ fill: info.color, r: info.isMe ? 4 : 3 }}
                    strokeDasharray={info.isMe ? undefined : '5 5'}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Per-Metric Stats */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Stats by Metric</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {requiredMetrics.map(metric => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedMetric === metric.id
                  ? 'bg-accent text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {metric.name}
            </button>
          ))}
        </div>

        {selectedMetric && metricChartData.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#666' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(v) => v === 100 ? 'Pass' : 'Fail'}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  formatter={(value) => [Number(value) === 100 ? 'Pass' : 'Fail']}
                  labelFormatter={(day) => `Day ${day}`}
                />
                <Legend />
                {Object.entries(participantInfo).map(([pid, info]) => {
                  if (!info.isMe && !showAll) return null;
                  return (
                    <Line
                      key={pid}
                      type="stepAfter"
                      dataKey={`status_${pid}`}
                      name={info.name}
                      stroke={info.color}
                      strokeWidth={info.isMe ? 3 : 2}
                      dot={{ fill: info.color, r: info.isMe ? 4 : 3 }}
                      strokeDasharray={info.isMe ? undefined : '5 5'}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!selectedMetric && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Select a metric to see detailed stats
          </p>
        )}
      </Card>

      {/* Summary Stats */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Your Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">
              {challenge.my_participant?.days_completed || 0}
            </div>
            <div className="text-xs text-muted-foreground">Days Complete</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">
              {challenge.my_participant?.current_streak || 0}
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {challenge.my_participant?.longest_streak || 0}
            </div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PhotosTab({ challenge }: { challenge: ChallengeWithParticipants }) {
  const { data: allEntries, isLoading } = useChallengeEntries(challenge.id);
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; name: string; date: string } | null>(null);

  // Group photos by date
  const photosByDate = useMemo(() => {
    if (!allEntries) return {};

    const grouped: Record<string, Array<{
      url: string;
      participantName: string;
      avatar: string | null;
      isBot: boolean;
      botAvatar: string | null;
    }>> = {};

    allEntries.forEach(entry => {
      if (!entry.photo_url) return;

      const participant = entry.participant as ChallengeParticipant & { profile?: { display_name?: string; username?: string; avatar_url?: string } };
      const name = participant?.is_bot
        ? participant?.bot_name || 'Bot'
        : participant?.profile?.display_name || participant?.profile?.username || 'User';

      if (!grouped[entry.entry_date]) {
        grouped[entry.entry_date] = [];
      }

      grouped[entry.entry_date].push({
        url: entry.photo_url,
        participantName: name,
        avatar: participant?.profile?.avatar_url || null,
        isBot: participant?.is_bot || false,
        botAvatar: participant?.bot_avatar || null,
      });
    });

    return grouped;
  }, [allEntries]);

  const sortedDates = Object.keys(photosByDate).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No photos yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Upload photos during check-in to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(date => {
        const dayNum = getDayNumber(challenge.start_date, date);
        const photos = photosByDate[date];

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Day {dayNum}</h3>
              <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhoto({ url: photo.url, name: photo.participantName, date: formatDate(date) })}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={photo.url}
                    alt={`${photo.participantName}'s photo`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                    <Avatar
                      src={photo.isBot ? null : photo.avatar}
                      alt={photo.participantName}
                      size="sm"
                      fallback={photo.isBot ? (
                        <span className="text-xs">{photo.botAvatar || '🤖'}</span>
                      ) : undefined}
                    />
                    <span className="text-xs text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.participantName}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Full-screen photo viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white"
          >
            <XCircle className="w-8 h-8" />
          </button>
          <div className="max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt="Full size"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4 text-white">
              <p className="font-medium">{selectedPhoto.name}</p>
              <p className="text-sm text-white/70">{selectedPhoto.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InviteModal({
  isOpen,
  onClose,
  inviteCode,
  challengeName,
}: {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  challengeName: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${challengeName}`,
          text: `Join my challenge "${challengeName}" on Challenges! Use code: ${inviteCode}`,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Share this code with friends to invite them to the challenge
          </p>

          <div className="bg-muted rounded-xl p-6">
            <p className="text-3xl font-mono font-bold tracking-widest">
              {inviteCode}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Invite
          </Button>

          <Button variant="outline" className="w-full" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Friends can join by entering this code in the &quot;Join Challenge&quot; screen
        </p>
      </div>
    </Modal>
  );
}
