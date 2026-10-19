export function headingId(value: string): string {
  return value.trim().toLocaleLowerCase("zh-CN").replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}
