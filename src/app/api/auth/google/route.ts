import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secure = process.env.APP_HTTPS === "true";
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", request.url).toString();
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/login?error=Google%20OAuth%20클라이언트%20설정이%20필요합니다", request.url));
  }
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const jar = await cookies();
  jar.set("calibra_google_state", state, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  jar.set("calibra_google_nonce", nonce, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, nonce, prompt: "select_account" }).toString();
  return NextResponse.redirect(url);
}
