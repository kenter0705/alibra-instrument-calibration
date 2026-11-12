import { networkInterfaces } from "node:os";
type Incoming = { url: string; headers: Headers };
export function incomingHost(request: Incoming): URL {
  const raw = request.headers.get("host") || new URL(request.url).host;
  const url = new URL(`${process.env.APP_HTTPS === "true" ? "https" : "http"}://${raw}`);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("잘못된 접속 주소입니다.");
  const allowed = new Set(["localhost", "127.0.0.1", "[::1]", ...Object.values(networkInterfaces()).flatMap(items => items || []).map(item => item.family === "IPv6" ? `[${item.address}]` : item.address)]);
  if (process.env.CALIBRA_PUBLIC_ORIGIN) allowed.add(new URL(process.env.CALIBRA_PUBLIC_ORIGIN).hostname);
  if (!allowed.has(url.hostname.toLowerCase())) throw new Error("서버에 등록되지 않은 주소입니다.");
  return url;
}
export function publicRequestOrigin(request: Incoming) { return incomingHost(request).origin; }
export function requestLink(request: Incoming, destination: string) { return new URL(destination, publicRequestOrigin(request)); }
export function sameOriginRequest(request: Incoming) { try { return request.headers.get("origin") === publicRequestOrigin(request); } catch { return false; } }
export function loopbackRequest(request: Incoming) { try { return ["localhost", "127.0.0.1", "[::1]"].includes(incomingHost(request).hostname); } catch { return false; } }
