-- Fix RLS policies to avoid infinite recursion and allow invite code joins

-- ============================================
-- CHALLENGES TABLE
-- ============================================

-- Drop all existing challenge SELECT policies
DROP POLICY IF EXISTS "Participants can view challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view challenges" ON challenges;
DROP POLICY IF EXISTS "Authenticated users can view active challenges" ON challenges;
DROP POLICY IF EXISTS "View active challenges" ON challenges;
DROP POLICY IF EXISTS "Owners can view own challenges" ON challenges;

-- Simple non-recursive policies for challenges
CREATE POLICY "View active challenges"
  ON challenges FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'active'
  );

CREATE POLICY "Owners can view own challenges"
  ON challenges FOR SELECT
  USING (owner_id = auth.uid());

-- ============================================
-- CHALLENGE_PARTICIPANTS TABLE
-- ============================================

-- Drop existing participant SELECT policy
DROP POLICY IF EXISTS "Participants can view other participants" ON challenge_participants;
DROP POLICY IF EXISTS "View participants of active challenges" ON challenge_participants;

-- Simple policy: view participants of active challenges
CREATE POLICY "View participants of active challenges"
  ON challenge_participants FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_participants.challenge_id
      AND challenges.status = 'active'
    )
  );
