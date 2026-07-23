# WhiskeyBlog

一个桌面优先的中文个人开发者网站，使用 Next.js、TypeScript、Tailwind CSS 与本地 MDX 内容。

## 本地开发

需要 Node.js 20.9 或更高版本。运行 npm install 安装依赖，再运行 npm run dev，并在浏览器打开 http://localhost:3000。

## 质量检查

依次运行 npm run lint、npm run typecheck、npm run test:unit 与 npm run build。

## 内容

文章放在 content/posts/，项目放在 content/projects/。每个 MDX 文件需要 title、description、date（YYYY-MM-DD）、tags 和 slug 五个 frontmatter 字段。

发布前请把示例项目与个人介绍替换为真实内容。不要提交 .env、密钥或私人凭据。

## 发布

将 GitHub 仓库导入 Vercel；可复制 .env.example 为 .env.local 并填写生产地址。部署后检查桌面和窄屏布局、亮暗主题、键盘焦点、页面标题与访问分析。
