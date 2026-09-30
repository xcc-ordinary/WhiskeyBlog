# WhiskeyBlog 项目交接文档

> 核查时间：2026-09-28（Asia/Shanghai）。目标读者：接手完善个人网站的 agent。本文是状态快照；涉及线上、数据库和本机文件的状态，接手时应重新核查。

## 1. 一分钟接手摘要

- 网站：WhiskeyBlog，线上域名 <https://sisyphe.me>，GitHub 仓库 <https://github.com/xcc-ordinary/WhiskeyBlog>。
- 本机主仓库：`C:\Users\16617\Desktop\WhiskeyBlog`。当前会话的工作目录 `C:\Users\16617\Documents\Whiskey` 是 Obsidian vault，**不是**网站仓库。
- 技术栈：Next.js 16.3.2 App Router、React 19.2.4、TypeScript、MDX、Tailwind CSS、GSAP、Lenis、Supabase；本地未提交实验增加 Three.js。
- `main` 和 `origin/main` 均指向 `75600ee`（2026-09-28，Add WowLand introduction and campus group QR）。线上是否正好部署该 SHA 未得到构建级证明。
- 当前工作树不干净：9 个已跟踪文件被修改，46 个未跟踪文件，后者约 92.13 MB。**不要运行 `git reset --hard`、`git clean -fd` 或 `git add .`。**这些文件包含正在开发的 3D 场景、图片和 Studio 页面修改。
- 本次仅做检查与交接，没有更改网站源码、提交、推送或部署。

## 2. 产品定位与设计意图

这是面向公众的中文个人开发者网站，用项目、文章与摄影档案呈现成长过程。当前视觉为暖白纸面、油画质感和柴油朋克港口主题的数字展厅；首页强调精选项目与生活档案，页面包含中英切换、响应式导航和受控滚动/视差。后续完善时应保持清晰的内容层级、语义与键盘可用性，保留原始图片构图，并在移动端、节能模式和减少动态效果偏好下提供静态回退。

现行源代码与历史设计文档并不完全一致。以当前代码和用户最新指令为准；`CONTEXT.md`、`README.md`、`docs/adr/` 与 `docs/superpowers/` 用于理解历史决策，不要直接当作当前完成清单。

## 3. 代码地图

| 位置 | 作用 |
| --- | --- |
| `app/page.tsx`、`components/exhibition/` | 首页、展厅、精选作品、滚动效果；`LivingScene` 相关文件目前未提交 |
| `app/about/`、`app/projects/`、`app/blog/`、`app/archive/` | 公开路由 |
| `content/posts/*.mdx`、`content/projects/*.mdx` | Git 管理的文章和项目正文；由 `lib/content.ts` 读入并校验 frontmatter |
| `components/mdx-content.tsx`、`components/article-reading-tools.tsx` | MDX 渲染、文章阅读辅助 |
| `lib/language.ts`、`components/language-provider.tsx` | 中英文案与语言状态 |
| `app/studio/`、`components/studio/` | 仅所有者使用的管理界面及 Server Actions |
| `lib/supabase/`、`supabase/migrations/` | Supabase Auth、照片数据、私有 Storage 与 RLS 迁移 |
| `public/images/` | 公开图像资源；许多较大的 PNG 仍是未跟踪设计素材 |
| `tests/unit/`、`tests/e2e/` | Vitest 与 Playwright；配置见 `vitest.config.mts`、`playwright.config.ts` |

公开主要路由：`/`、`/about`、`/projects`、`/projects/[slug]`、`/blog`、`/blog/[slug]`、`/archive`。Studio 路由：`/studio`、`/studio/login`、`/studio/projects`、`/studio/writing`、`/studio/[id]`；登录回调为 `/auth/callback`。公开内容目前有 5 篇 MDX 文章与 2 个 MDX 项目。构建产出的项目详情页仅 `/projects/whiskey-blog` 和 `/projects/learning-lab`。

## 4. 本地与线上状态证据

### 本地检查（2026-09-28）

| 检查 | 结果 |
| --- | --- |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run build` | 通过；Next.js 16.3.2，生成 23 个静态页面 |
| `npm run test:unit` | **失败：60/62 通过，21 个测试文件中 1 个失败**。`tests/unit/gallery-signed-url.test.tsx` 的两项测试因渲染 `AsymmetricalParallaxGallery` 时缺少 `LanguageProvider` 抛错。尚未修复或复测。 |
| `npm run test:e2e` | 本次未执行。`tests/e2e/living-scene.spec.ts` 为未跟踪的新测试。 |
| `git diff --check` | 通过；Git 另提示若干文件 LF/CRLF 行尾将来可能被转换。 |

### 线上只读探测（2026-09-28）

对 `https://sisyphe.me` 发送 HEAD 请求：`/`、`/about`、`/projects`、`/blog`、`/archive`、`/studio`、`/projects/whiskey-blog`、`/projects/learning-lab`、`/blog/wowland-campus` 返回 200。`/projects/dreambook-realm` 与 `/projects/lumi` 返回 404。这个探测只能确认 HTTP 响应，不能证明视觉、交互、登录、照片数据或部署 SHA。以前的部署验证见 Git 历史与相关任务记录，不可替代当前验收。

### 内容与导航的已知差距

首页 `app/page.tsx` 硬编码 Dreambook Realm、Lumi 为精选展示；对应图片已纳入 Git，但 `content/projects/` 里没有这两个 slug 的 MDX，因此其详情路由为 404。`SelectedWorks` 当前卡片的传入 `href` 是 `/projects`，不是相应详情页，故不要把此事描述为“首页卡片点击必然 404”。先决定为这两项补案例页，或改为现有项目并统一文案与封面。

## 5. 未提交工作：务必保存

**已跟踪文件的 9 项修改：**

- Studio 接入 `LivingScene`：`app/studio/page.tsx`、`app/studio/writing/page.tsx`、`app/studio/[id]/page.tsx`。
- 展厅接入 `LivingScene`：`components/exhibition/asymmetrical-parallax-gallery.tsx`、`editorial-footer.tsx`、`explorer-hero.tsx`、`selected-works.tsx`。
- `package.json`、`package-lock.json`：增加 `three` 与 `@types/three`。

**46 个未跟踪文件（约 92.13 MB）：**

- 新场景实现：`components/exhibition/living-scene.tsx`、`living-scene.module.css`、`scene-integration.css`、`scene-models.ts`、`scene-presets.ts`、`scene-renderer.ts`。
- 新测试：`tests/e2e/living-scene.spec.ts`。
- 多张位于 `public/images/` 的港口、人物、画廊和文章封面 PNG，以及仓库根目录 5 张 `.codex-*.png` 本地截图。精确清单可在主仓库运行 `git status --short`，或查看本次附带的源码快照。
- 注意：`LivingScene` 引用的主要 `.webp` 回退底图已经是 Git 跟踪资源，未跟踪 PNG 多数是源图/探索资产；不要按文件名猜测删除。

**当前 3D 场景状态：**类型检查和生产构建通过。组件按可见性创建/释放 WebGL、在 `prefers-reduced-motion` 和 `saveData` 下尝试静态回退，并有暂停/视角按钮。但本次没有证明真实 WebGL 呈现、指针/水波反馈、移动端裁切、浏览器控制台或长时间运行稳定性。完成前先复核既有 CSS 叠层与图片回退，再跑真实浏览器测试和人工视觉验收。不要把“构建通过”写成“3D 已完成”。

## 6. 数据、权限与部署边界

- 项目/文章目前是本地 MDX。`lib/content.ts` 从磁盘读文件；`app/studio/writing/actions.ts` 与 `app/studio/projects/actions.ts` 也写本机文件。`lib/content-writes.ts` 在 `VERCEL=1` 时拒绝这些写操作。线上编辑文章/项目的流程是本地修改、提交 Git、让 Vercel 重新部署；线上 Studio 的这些部分会显示只读提示。
- 摄影档案使用 Supabase Auth、Postgres 与私有 `originals`/`derivatives` Storage。公开查询走 `published_photographs`，签名衍生图链接用于公开展示。身份核验集中在 `lib/supabase/auth.ts` 的 `requireOwner`；具体迁移和首次配置步骤见 `README.md` 与 `supabase/migrations/0001`—`0003`。
- `.env.local` 在本机存在并被 Git 忽略；检查时可见三个 Supabase 变量名已设置，未输出或打包任何值。`.env.example` 列出需要的 `NEXT_PUBLIC_SITE_URL`、Supabase 公共 URL/匿名密钥与服务端 service-role 密钥。**不要通过聊天、文档、提交或附件传递真实密钥。** `NEXT_PUBLIC_SITE_URL` 在当前本机 `.env.local` 中未出现；代码有 Vercel URL 回退，但生产环境配置需接手者单独核查。
- 曾有历史审计指出 `published_photographs` 的 anon 可见性、迁移 `0003` 是否已在真实数据库执行、Magic Link 登录和图片体积等问题；本次没有访问数据库或执行生产 Studio 流程，全部视为**待复核**，不要当作当前故障或已修复。
- Vercel 由 GitHub 发布。没有部署授权的后续 agent 应先完成本地修改与验证，再按用户明确要求提交/推送/发布，并用 Vercel 状态、线上 HTML/资源及真实浏览器复核。

## 7. 建议给下一位 agent 的执行顺序

1. 在 `C:\Users\16617\Desktop\WhiskeyBlog` 打开仓库，先读 `AGENTS.md`。该文件明确要求修改 Next.js 代码前查阅 `node_modules/next/dist/docs/` 的对应版本文档。
2. 运行 `git status --short --branch`、`git log -1 --oneline` 并核对本交接快照；保留未提交工作。若在另一环境接手，先解压随附源码快照，然后从 GitHub 获取完整 Git 历史。
3. 根据用户新的优先目标选定范围。若继续 3D 场景，先修复或更新画廊测试的 Provider 设置，检查未跟踪场景文件与图片依赖，并在桌面、窄屏、减少动态效果和弱设备条件下验证静态回退与交互。
4. 把首页精选项目与实际项目详情/文案对齐；补真实案例时不要把占位信息写成真实项目成果。复核 `README.md`、`lib/exhibition.ts` 的旧占位文案与现行页面的一致性。
5. 上线前复核 Supabase 迁移、anon 公开查询、Studio 所有者登录、生产变量、图片体积、可访问性与持久化限制。提交时只暂存本次明确范围内的文件。

## 8. 复现命令与交接参考

在网站仓库中运行：

```powershell
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
git status --short --branch
```

本次只实际运行了 lint、typecheck、unit、build、`git diff --check` 和线上 HEAD 探测；`npm ci`、dev 与 E2E 是给接手者的复现命令。Playwright 默认起本地 `3101` 端口，设置 `PLAYWRIGHT_BASE_URL` 可改为现有服务。Node.js 要求见 `README.md`；依赖锁定文件是 `package-lock.json`。

重要参考：`README.md`（运行与部署）、`CONTEXT.md`（最初产品语义）、`docs/adr/0001-first-release-platform.md`、`docs/adr/0002-supabase-media-studio.md`、`docs/superpowers/specs/` 与 `docs/superpowers/plans/`（历史规格/计划）。这些文件已有详细背景，本文不复制其全部内容。

## 9. Suggested skills（建议技能）

- `apple-design`：审视页面层级、响应式、语义控件和可访问性；按当前视觉方向取舍。
- `diagnosing-bugs`：追查 3D 场景、浏览器交互或 Studio 登录的真实故障。
- `code-review`：在提交或部署前审查新增场景及工作树差异。
- `handoff`：下一轮完成后更新简要交接说明；不要让旧快照替代当次验证。

## 10. 给下一位 agent 的可复制提示词

> 请接手 `C:\Users\16617\Desktop\WhiskeyBlog` 的 WhiskeyBlog 个人网站。先阅读这份交接文档、仓库 `AGENTS.md` 和 `README.md`，核对 Git 状态与未提交文件；不要清理、覆盖或整批暂存这些文件。网站线上为 `https://sisyphe.me`，主分支快照为 `75600ee`。当前构建、lint、typecheck 通过，单元测试 60/62 通过；3D LivingScene 仍需真实浏览器与视觉验证。请按我接下来说明的目标继续，区分本地源码、未提交实验和线上已部署版本，并在修改后给出实际验证证据。

---

交接包中的源码 ZIP 排除 `.env.local`、所有 `.env*` 私密配置、`.git`、`node_modules`、`.next`、测试结果和工作树管理目录；包含 Git 跟踪文件及未跟踪的源码、图片、截图。它是可移交源码快照，不含 Git 历史和线上数据库备份；完整提交历史在 GitHub，Supabase 数据需单独按平台导出流程备份。

---

## 附：2026-09-29 接手后的连接修复记录（对上面快照的补充，不改写原快照）

本轮只做「把该连接的全部连接」：修复断开/脱节的连接与测试接线，未提交、未推送、未部署，未清理任何未提交工作。

**已修复：**

1. **首页精选卡片 → 项目详情页**（原第 4 节缺口，用户已决策“补案例页”）：新增 `content/projects/dreambook-realm.mdx`、`content/projects/lumi.mdx`（frontmatter 与首页双语文案、Git 内封面一致；正文只写站点已有文案中的信息，未证实细节不编造，`role` 留空由详情页显示“待补充”）。`components/exhibition/selected-works.tsx` 的卡片由无链接 `<article>` 改为 `<Link href="/projects/<slug>">`（35fd276 之前本就是 Link），并修正传入 `ProjectMedia` 的 href。详情路由、`/projects` 列表、sitemap、`ProjectCaseStudyNav` 随即自动连通。
2. **画廊单元测试 ↔ LanguageProvider**（原 60/62）：`tests/unit/gallery-signed-url.test.tsx` 用 `LanguageProvider` 包裹渲染，复跑 **62/62 通过**。
3. **e2e 断言脱节**（自 35fd276 起，原文档记录“本次未执行”）：`tests/e2e/exhibition.spec.ts` 更新 region 名（“精选项目”→“正在发生的作品”、“横向滚动摄影画廊”→“横向滚动生活档案”）、hero CTA 名与 href（英文名→中文“探索精选作品”，`/projects`→`#selected-work`，后者是 35fd276 的既定设计，改测试而非改行为）、引用标签“PRIVATE OBSERVATIONS”→“私人观察”；`tests/e2e/living-scene.spec.ts` 三处链接名改中文、URL 期望改 `/#selected-work`。另新增一条测试锁定“精选卡片可点进真实详情页”。触摸滚动测试改写：本沙箱中 CDP 合成滚动手势对空白页面也不产生滚动（headless shell 与完整 Chromium 均验证），故改为断言“场景不取消触摸事件、无 CSS 滚动陷阱、文档仍可原生滚动、Lenis 在粗指针下不启用”等等价不变量。

**本轮实测证据（2026-09-29，本机）：** lint 通过；typecheck 通过；unit 62/62；build 通过并生成 25 个静态页（原 23，新增两个项目详情页）；e2e **25/25 通过**（冷启动连续两遍，含删除 `.next` 后一遍）；`git diff --check` 干净（仅既有的 LF/CRLF 提示）；生产构建实访：两个详情页渲染出正文与元数据，首页卡片指向 `/projects/<slug>`，sitemap 含新路由。

**环境备注（非代码问题）：** `npm run build` 可能因 Google Fonts 拉取被间歇性 ECONNRESET 打断而失败，重试即过（本轮第 1 次失败、第 2 次成功）。本轮首次冷跑 e2e 曾出现 16 连败，均为 Turbopack 冷编译超时；预热或重跑后稳定通过。若接手时遇到大规模超时，先重跑一遍再判断。

**仍未解决（留给后续，非本轮范围）：** 未提交/未推送；3D LivingScene 未做真实浏览器视觉验收与移动端裁切复核；Supabase 迁移 0003 是否已在真实库执行、anon 可见性、Magic Link 登录待复核；`NEXT_PUBLIC_SITE_URL` 本机 `.env.local` 仍未设置（本地 canonical 回落 localhost:3000，生产需单独核查）；`lib/exhibition.ts` 的 `homeIdentity`/`currentFacts` 目前只被未使用的 `about-field-notes.tsx` 引用（死代码），README 的“内容替换清单”与此不一致，值得后续 reconcile。
