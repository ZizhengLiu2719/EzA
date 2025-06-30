# 🔧 EzA AI 功能故障排查指南

## 问题现象

- AI 聊天界面显示"AI thinking..."且不消失
- 发送消息后没有收到 AI 回复
- 界面卡在加载状态

## 🔍 诊断步骤

### 1. 使用内置诊断工具

1. 访问 TaskAssistant 页面
2. 在左侧边栏找到"🔧 EzA AI 诊断工具"
3. 依次点击：
   - "检查环境变量" - 确认配置正确
   - "🧪 测试 AI 连接" - 测试完整 AI 流程

### 2. 检查浏览器开发者工具

1. 按 F12 打开开发者工具
2. 切换到 Console 标签
3. 查看是否有错误信息
4. 切换到 Network 标签查看网络请求

### 3. 常见错误及解决方案

#### ❌ 错误："OpenAI API key not configured"

**原因：** API 密钥未配置或配置错误
**解决：**

```bash
# 检查.env文件是否存在且包含：
VITE_OPENAI_API_KEY=sk-proj-your-api-key-here
```

#### ❌ 错误："OpenAI API error: Incorrect API key"

**原因：** API 密钥无效或已过期
**解决：**

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 生成新的 API 密钥
3. 更新.env 文件中的 VITE_OPENAI_API_KEY

#### ❌ 错误："Network Error" 或请求超时

**原因：** 网络连接问题或 API 服务不可用
**解决：**

1. 检查网络连接
2. 确认 OpenAI 服务状态：https://status.openai.com/
3. 检查防火墙/代理设置

#### ❌ 错误："Rate limit exceeded"

**原因：** API 调用频率超过限制
**解决：**

1. 等待一段时间后重试
2. 检查 API 使用配额
3. 考虑升级 OpenAI 计划

#### ❌ 错误："用户未登录"

**原因：** Supabase 认证问题
**解决：**

1. 重新登录 EzA 账户
2. 检查 Supabase 配置
3. 清除浏览器缓存重新登录

### 4. 手动测试 API 连接

#### 使用 curl 测试 OpenAI API：

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

#### 预期响应：

```json
{
  "choices": [
    {
      "message": {
        "content": "Hello! How can I help you today?"
      }
    }
  ]
}
```

### 5. 环境变量检查清单

确认以下环境变量已正确配置：

- ✅ `VITE_OPENAI_API_KEY` - OpenAI API 密钥
- ✅ `VITE_SUPABASE_URL` - Supabase 项目 URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥

### 6. 代码层面检查

#### 检查 AI Service 实例化：

```typescript
// 在浏览器控制台中运行：
console.log(
  "OpenAI API Key:",
  import.meta.env.VITE_OPENAI_API_KEY ? "已配置" : "未配置"
);
```

#### 检查网络请求：

1. 开发者工具 → Network 标签
2. 发送 AI 消息
3. 查找指向 `api.openai.com` 的请求
4. 检查请求状态码和响应

### 7. 重启和清缓存

1. **重启开发服务器**：

   ```bash
   # 停止服务器 (Ctrl+C)
   npm run dev
   ```

2. **清除浏览器缓存**：

   - Ctrl+Shift+R (硬刷新)
   - 或清除浏览器数据

3. **清除 Node.js 缓存**：
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

## 🚀 高级诊断

### 使用诊断组件

EzA 内置了 AI 诊断组件，位于 TaskAssistant 页面的左侧边栏。该组件可以：

- 检查所有环境变量配置
- 测试完整的 AI 对话流程
- 显示详细的错误信息
- 记录调试日志

### 日志级别设置

在开发模式下，可以在浏览器控制台中启用详细日志：

```javascript
localStorage.setItem("debug", "exa:*");
```

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供以下信息：

1. 具体的错误信息（截图）
2. 浏览器控制台的错误日志
3. 网络请求的详细信息
4. 使用的操作系统和浏览器版本
5. AI 诊断工具的测试结果

## 🔧 开发环境特定问题

### Vite 环境变量注意事项

- 环境变量必须以`VITE_`开头才能在客户端访问
- 修改.env 文件后需要重启开发服务器
- 环境变量不能包含换行符或特殊字符

### TypeScript 类型检查

如果遇到 TypeScript 相关错误：

```bash
npm run type-check
```

### 构建问题

如果开发环境正常但构建失败：

```bash
npm run build
npm run preview
```
