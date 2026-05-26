export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/lesson/:path*", "/curriculum", "/progress", "/settings"],
};
