-- 快速修复 EzA AI 数据库权限问题
-- 在 Supabase SQL Editor 中运行此脚本

-- 临时禁用 RLS (如果表已存在)
ALTER TABLE IF EXISTS ai_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_messages DISABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON ai_conversations;

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON ai_messages;
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON ai_messages;

-- 重新启用 RLS 并设置正确的策略
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- 设置 ai_conversations 表策略
CREATE POLICY "Enable all for authenticated users" ON ai_conversations
    FOR ALL USING (auth.role() = 'authenticated');

-- 设置 ai_messages 表策略  
CREATE POLICY "Enable all for authenticated users" ON ai_messages
    FOR ALL USING (auth.role() = 'authenticated'); 