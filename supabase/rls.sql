-- トレプロクエスト RLS設定
-- 実行順: 3番目（seed.sql の後）

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数: 現在のユーザーのロール取得
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_member_slug()
RETURNS TEXT AS $$
  SELECT member_slug FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- members
CREATE POLICY "members_select" ON members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "members_update_admin" ON members
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- missions
CREATE POLICY "missions_select" ON missions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "missions_all_admin" ON missions
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- member_progress
CREATE POLICY "progress_select" ON member_progress
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'reviewer')
    OR member_id IN (
      SELECT id FROM members WHERE slug = get_user_member_slug()
    )
  );

CREATE POLICY "progress_update_admin_reviewer" ON member_progress
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'reviewer'));

CREATE POLICY "progress_update_member" ON member_progress
  FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'member'
    AND member_id IN (
      SELECT id FROM members WHERE slug = get_user_member_slug()
    )
  )
  WITH CHECK (
    result = (SELECT result FROM member_progress WHERE id = member_progress.id)
  );

CREATE POLICY "progress_insert_admin" ON member_progress
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- activity_logs
CREATE POLICY "logs_select" ON activity_logs
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'reviewer'));

CREATE POLICY "logs_insert" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
