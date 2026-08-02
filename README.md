# WhiskeyBlog

一个桌面优先的中文个人开发者网站，使用 Next.js、TypeScript、Tailwind CSS 与本地 MDX 内容。

## 本地开发

需要 Node.js 20.9 或更高版本。运行 npm install 安装依赖，再运行 npm run dev，并在浏览器打开 http://localhost:3000。

## 质量检查

依次运行 npm run lint、npm run typecheck、npm run test:unit 与 npm run build。

## 内容

文章放在 content/posts/，项目放在 content/projects/。每个 MDX 文件需要 title、description、date（YYYY-MM-DD）、tags 和 slug 五个 frontmatter 字段。

发布前请把示例项目与个人介绍替换为真实内容。不要提交 .env、密钥或私人凭据。

## Media Studio（Supabase）

Media Studio 使用 Supabase Auth、私有 Storage 和 Postgres。不要在仓库中填写项目 URL、密钥或所有者邮箱；将 `.env.example` 复制为 `.env.local`，再填写以下值：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL，可安全发送到浏览器。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase 匿名（publishable）密钥，可安全发送到浏览器。
- `SUPABASE_SERVICE_ROLE_KEY`：仅服务器使用的 service-role 密钥。绝不能使用 `NEXT_PUBLIC_` 前缀，也绝不能提交。

首次部署由站点所有者在 Supabase 控制台完成：

1. 创建 Supabase 项目，并在 Authentication 的 URL Configuration 中设置实际 Site URL；将本地地址和生产站点的 Studio 登录回调地址加入 Redirect URLs。
2. 在 SQL Editor 应用 `supabase/migrations/0001_photographs.sql`。该迁移创建私有的 `originals` 与 `derivatives` bucket、`photographs` 表、RLS 策略和发布约束。
3. 在同一个 SQL Editor 写入唯一允许访问 Studio 的邮箱（替换为自己的小写邮箱）：
   ```sql
   insert into private.media_studio_settings (singleton, owner_email)
   values (true, 'your-owner-email@example.com')
   on conflict (singleton) do update set owner_email = excluded.owner_email;
   ```
   在这一步前，RLS 会拒绝所有 Studio 访问；不要把该邮箱放入公开环境变量。
4. 接着应用 `supabase/migrations/0002_owner_authorization.sql`。它创建登录后用于确认所有者资格的安全 RPC；没有这一步，Studio 会正确地拒绝所有访问。
5. 在 Authentication 中启用 Email magic link，并把生产环境中的三个 Supabase 环境变量设置到部署平台。service-role 密钥只应出现在服务器环境中。

原图和衍生图 bucket 都是私有的。公开页面只能查询 `published_photographs` 视图：它只返回已发布的衍生图路径和展示元数据，绝不返回 `originals` 中的对象路径或私有草稿数据。

## 发布

将 GitHub 仓库导入 Vercel；可复制 .env.example 为 .env.local 并填写生产地址。部署后检查桌面和窄屏布局、亮暗主题、键盘焦点、页面标题与访问分析。
