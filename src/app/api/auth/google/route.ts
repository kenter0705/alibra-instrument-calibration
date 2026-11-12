import { requestLink } from "@/lib/request-origin";
import { SESSION_COOKIE, appCookie } from "@/lib/app-edition";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secure = process.env.APP_HTTPS === "true";
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || requestLink(request, "/api/auth/google/callback").toString();
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(requestLink(request, "/login?error=Google%20OAuth%20클라이언트%20설정이%20필요합니다"));
  }
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const jar = await cookies();
  jar.set(appCookie("google_state"), state, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  jar.set(appCookie("google_nonce"), nonce, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  // Keep account selection available while preselecting the user's usual account.
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    login_hint: process.env.CALIBRA_GOOGLE_LOGIN_EMAIL || "kenter6746060@gmail.com",
    prompt: "select_account",
  }).toString();
  return NextResponse.redirect(url);
}
