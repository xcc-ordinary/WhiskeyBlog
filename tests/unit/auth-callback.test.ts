// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";
const auth = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth }) }));
beforeEach(() => { vi.resetAllMocks(); auth.exchangeCodeForSession.mockResolvedValue({ error: null }); auth.verifyOtp.mockResolvedValue({ error: null }); });
describe("Studio email callback", () => {
  it("preserves an expired-email error so the owner can request a new link", async () => {
    const response = await GET(new Request("https://sisyphe.me/auth/callback?error=access_denied&error_code=otp_expired"));
    expect(response.headers.get("location")).toBe("https://sisyphe.me/studio/login?error=otp_expired");
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
  it("accepts email token hashes without a verifier from the original browser", async () => {
    const response = await GET(new Request("https://sisyphe.me/auth/callback?token_hash=test-hash&type=email"));
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "test-hash", type: "email" });
    expect(response.headers.get("location")).toBe("https://sisyphe.me/studio");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "%E0%A4%A"])("keeps redirect %s on this site", async next => {
    const response = await GET(new Request(`https://sisyphe.me/auth/callback?code=test&next=${encodeURIComponent(next)}`));
    expect(response.headers.get("location")).toBe("https://sisyphe.me/studio");
  });
});
