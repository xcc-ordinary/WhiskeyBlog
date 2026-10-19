# Studio 线上登录与内容发布

生产站点：`https://sisyphe.me`。本次检查确认站点登录页返回 200，但 Supabase 会把生产认证回调退回 `http://localhost:3000/`。

## 1. 修正登录回调

进入现有 Supabase 项目 → Authentication → URL Configuration：

- Site URL：`https://sisyphe.me`
- Redirect URLs：添加精确地址 `https://sisyphe.me/auth/callback`
- 兼容已发出的旧邮件：添加 `https://sisyphe.me/auth/callback?next=/studio`
- 本地开发需要时保留 `http://localhost:3000/auth/callback`。

保存后回到 `https://sisyphe.me/studio/login`，发送一封新邮件。旧邮件中的链接不会因修改配置而恢复；仅打开最新邮件，链接只能使用一次。

默认 Magic Link 邮件模板应使用 `{{ .ConfirmationURL }}`，不要把 localhost 写进模板。PKCE 链接需在发起登录的同一浏览器打开。

如需允许从另一个浏览器打开邮件，可把 Magic Link 模板中的链接改为：

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">登录 Studio</a>
```

新代码支持 `type=email` 的 token hash 验证，旧版代码不支持；必须先部署新版本再修改模板。登录页发送的 RedirectTo 不带查询参数。邮箱安全扫描也可能提前消耗一次性链接；遇到此情况重新发送，或后续切换手动验证码。

## 2. 启用线上作品和文章存储

前提：已有摄影数据库迁移 0001–0003，且 `private.media_studio_settings` 配置了你的所有者邮箱。

1. 在 Supabase SQL Editor 执行 `supabase/migrations/0004_studio_documents.sql`，只执行一次。它创建内容表和公开的 `content-images` bucket，只有现有所有者能写入。
2. 在 Vercel 的 Production 环境变量中设置：

   ```text
   NEXT_PUBLIC_SITE_URL=https://sisyphe.me
   STUDIO_CONTENT_BACKEND=supabase
   ```

   保留现有 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 与仅服务器使用的 `SUPABASE_SERVICE_ROLE_KEY`，不要把密钥发到聊天或提交进 Git。
3. 部署包含本次修复的代码。环境变量只对新部署生效。

启用前线上编辑保持关闭，公开页面继续展示仓库内容；迁移执行成功后再启用变量，避免公开页面查询不存在的数据表。

## 3. 使用方式与数据边界

- `/studio/projects`：创建或编辑作品，上传封面或正文图片，保存后同步首页、项目目录及详情。
- `/studio/writing`：创建或编辑文章，上传封面，保存后同步博客目录及详情。
- 点击发布设置中的“发布 / 更新”后才写入云端并公开。编辑期间自动备份到本机浏览器，不是云端私密草稿；完整操作见 `docs/studio-writing.md`。
- 项目和博客图片是公开素材，上传后即有公开地址。私人照片继续使用现有私有 `originals`/`derivatives` bucket。
- 支持 JPG、PNG、WebP、GIF，每张不超过 3.75MB，验证文件内容后再上传。
- 仓库 MDX 保持原样；在线保存的同 slug 内容优先展示。新内容无需重新部署即能读取；数据库或图片上传失败会提示失败。
- 云端数据以 Supabase 为准，需要自行备份；停用云端变量会回退到仓库版本，不会自动导出在线修改。

## 4. 真实验收

1. 使用所有者邮箱完成一次新链接登录，确认地址始终在 `sisyphe.me`。
2. 上传真实公开封面并保存一篇文章和一个项目。
3. 用未登录窗口核对首页、目录、详情和图片。
4. 再部署一次后刷新，确认在线内容仍存在。
5. 用非所有者账号确认无法写内容或上传文件。

本地回归测试覆盖回调错误、token hash、同源跳转、持久化分支、未授权写入拒绝、云端优先合并及本地内容回退。它们不代表已经完成上述真实邮箱及生产存储验收。
