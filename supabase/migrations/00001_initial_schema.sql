-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  total_challenges_completed INTEGER DEFAULT 0,
  total_days_completed INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Templates
CREATE TABLE challenge_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  category TEXT,
  icon TEXT,
  color TEXT,
  is_official BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Challenges
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES challenge_templates(id),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL,
  metrics JSONB NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  visibility TEXT DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_bot BOOLEAN DEFAULT false,
  bot_type TEXT CHECK (bot_type IS NULL OR bot_type IN ('consistent', 'human', 'struggling')),
  bot_name TEXT,
  bot_avatar TEXT,
  days_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Daily Entries
CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  metrics_data JSONB NOT NULL DEFAULT '{}',
  is_complete BOOLEAN DEFAULT false,
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, entry_date)
);

-- User Badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_id)
);

-- Indexes for performance
CREATE INDEX idx_daily_entries_participant_date ON daily_entries(participant_id, entry_date);
CREATE INDEX idx_daily_entries_challenge_date ON daily_entries(challenge_id, entry_date);
CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_challenges_invite_code ON challenges(invite_code);
CREATE INDEX idx_challenges_owner ON challenges(owner_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_profiles_username ON profiles(username);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Challenge templates policies
CREATE POLICY "Templates are viewable by everyone"
  ON challenge_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can create templates"
  ON challenge_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Challenges policies
CREATE POLICY "Participants can view challenges"
  ON challenges FOR SELECT
  USING (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_participants.challenge_id = challenges.id
      AND challenge_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete challenges"
  ON challenges FOR DELETE
  USING (auth.uid() = owner_id);

-- Challenge participants policies
CREATE POLICY "Participants can view other participants"
  ON challenge_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id
      AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (is_bot = true AND EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_id
      AND challenges.owner_id = auth.uid()
    ))
  );

CREATE POLICY "Participants can update own participation"
  ON challenge_participants FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (is_bot = true AND EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_id
      AND challenges.owner_id = auth.uid()
    ))
  );

-- Daily entries policies
CREATE POLICY "Participants can view entries"
  ON daily_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = daily_entries.challenge_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can create own entries"
  ON daily_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.id = participant_id
      AND (
        cp.user_id = auth.uid()
        OR (cp.is_bot = true AND EXISTS (
          SELECT 1 FROM challenges
          WHERE challenges.id = cp.challenge_id
          AND challenges.owner_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Participants can update own entries"
  ON daily_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.id = participant_id
      AND cp.user_id = auth.uid()
    )
  );

-- User badges policies
CREATE POLICY "Badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_entries_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update streak on entry completion
CREATE OR REPLACE FUNCTION update_participant_streak()
RETURNS TRIGGER AS $$
DECLARE
  prev_entry daily_entries;
  new_streak INTEGER;
BEGIN
  IF NEW.is_complete AND (OLD IS NULL OR NOT OLD.is_complete) THEN
    -- Check if there's an entry for yesterday
    SELECT * INTO prev_entry
    FROM daily_entries
    WHERE participant_id = NEW.participant_id
    AND entry_date = NEW.entry_date - INTERVAL '1 day'
    AND is_complete = true;

    IF FOUND THEN
      -- Continue streak
      SELECT current_streak INTO new_streak
      FROM challenge_participants
      WHERE id = NEW.participant_id;
      new_streak := new_streak + 1;
    ELSE
      -- Start new streak
      new_streak := 1;
    END IF;

    UPDATE challenge_participants
    SET
      current_streak = new_streak,
      longest_streak = GREATEST(longest_streak, new_streak),
      days_completed = days_completed + 1
    WHERE id = NEW.participant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_entry_complete
  AFTER INSERT OR UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_participant_streak();
