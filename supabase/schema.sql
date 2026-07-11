-- トレプロクエスト スキーマ定義
-- 実行順: 1番目

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- プロフィール（Auth連携）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'member')),
  member_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- メンバー
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '旅立ち前の新人',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ミッション
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_group TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  reviewer_name TEXT NOT NULL DEFAULT '-',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- メンバー進捗
CREATE TABLE IF NOT EXISTS member_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT '未着手'
    CHECK (status IN ('未着手', '準備中', '実施中', '審査待ち', '再挑戦', '完了')),
  result TEXT NOT NULL DEFAULT '未審査'
    CHECK (result IN ('未審査', '合格', '不合格')),
  executed_at DATE,
  feedback TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT '',
  due_date DATE,
  tldb_url TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, mission_id)
);

-- 活動ログ
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_member_progress_member ON member_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_member_progress_mission ON member_progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_member ON activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER member_progress_updated_at
  BEFORE UPDATE ON member_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 新規ユーザー登録時にprofilesを自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
