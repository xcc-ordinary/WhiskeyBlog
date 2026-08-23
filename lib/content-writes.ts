import "server-only";

type RuntimeEnvironment = Record<string, string | undefined>;

export function repositoryContentWritesAvailable(environment: RuntimeEnvironment = process.env): boolean {
  return environment.VERCEL !== "1";
}

export function requireRepositoryContentWrites(environment: RuntimeEnvironment = process.env): void {
  if (!repositoryContentWritesAvailable(environment)) {
    throw new Error("Vercel 部署是不可变的；请在本地编辑内容并通过 Git 发布。线上照片管理仍可正常使用。");
  }
}
