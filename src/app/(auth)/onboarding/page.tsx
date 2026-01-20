'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Globe, Flame } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { detectTimezone } from '@/lib/utils';
import { TIMEZONES } from '@/lib/constants';

const onboardingSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  timezone: z.string().min(1, 'Please select a timezone'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      timezone: detectTimezone(),
    },
  });

  useEffect(() => {
    // Auto-detect timezone on mount
    setValue('timezone', detectTimezone());
  }, [setValue]);

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: data.username.toLowerCase(),
        display_name: data.display_name,
        timezone: data.timezone,
      });

    if (error) {
      if (error.code === '23505') {
        setError('Username is already taken');
      } else {
        setError(error.message);
      }
      setIsLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
          <Flame className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold">Complete your profile</h1>
        <p className="text-muted-foreground">Let&apos;s get you set up</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="label">Username</label>
          <Input
            placeholder="johndoe"
            icon={<User className="w-5 h-5" />}
            error={errors.username?.message}
            {...register('username')}
          />
          <p className="text-xs text-muted-foreground">
            This is your unique identifier. Letters, numbers, and underscores only.
          </p>
        </div>

        <div className="space-y-2">
          <label className="label">Display Name</label>
          <Input
            placeholder="John Doe"
            error={errors.display_name?.message}
            {...register('display_name')}
          />
        </div>

        <div className="space-y-2">
          <label className="label">Timezone</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <select
              className="flex h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2 text-foreground appearance-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              {...register('timezone')}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          {errors.timezone && (
            <p className="text-sm text-destructive">{errors.timezone.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Continue
        </Button>
      </form>
    </div>
  );
}
