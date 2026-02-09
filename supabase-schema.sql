-- DailyInsightHub Supabase 数据库建表 SQL
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_zh TEXT,
  url TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  rank INTEGER,
  heat_value INTEGER,
  published_at TIMESTAMPTZ,
  fetched_date DATE NOT NULL,
  tags TEXT[],
  language TEXT DEFAULT 'zh',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_url_date ON articles(url, fetched_date);
CREATE INDEX IF NOT EXISTS idx_articles_date_category ON articles(fetched_date, category);
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- 日报分析表
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  highlights JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 数据源配置表
CREATE TABLE IF NOT EXISTS sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  default_category TEXT,
  enabled BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS（行级安全策略）
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "允许公开读取 articles" ON articles FOR SELECT USING (true);
CREATE POLICY "允许公开读取 daily_reports" ON daily_reports FOR SELECT USING (true);
CREATE POLICY "允许公开读取 sources" ON sources FOR SELECT USING (true);

-- Service Role 写入策略（定时任务用）
CREATE POLICY "允许 service role 写入 articles" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允许 service role 写入 daily_reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允许 service role 写入 sources" ON sources FOR ALL USING (true) WITH CHECK (true);
