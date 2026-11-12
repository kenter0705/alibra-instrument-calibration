export function serverAddress(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("서버 PC의 IP 주소를 입력하세요.");
  const parts = raw.match(/^(?:https?:\/\/)?(localhost|\d{1,3}(?:\.\d{1,3}){3})(?::([1-9]\d{0,4}))?\/?$/i);
  if (!parts || (parts[1] !== "localhost" && parts[1].split(".").some(x => Number(x) > 255 || (x.length > 1 && x.startsWith("0")))) || (parts[2] && Number(parts[2]) > 65535)) throw new Error("올바른 IP 주소와 포트를 입력하세요. 예: 192.168.0.10:4000");
  const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("IP 주소와 포트만 입력하세요. 예: 192.168.0.10:4000");
  }
  const host = url.hostname;
  if (host !== "localhost" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) throw new Error("올바른 IPv4 주소를 입력하세요.");
  if (host !== "localhost" && host.split(".").some(x => Number(x) > 255)) throw new Error("올바른 IP 주소를 입력하세요.");
  if (host === "0.0.0.0" || host === "255.255.255.255") throw new Error("서버 PC에 실제로 할당된 IP 주소를 입력하세요.");
  if (!parts[2]) url.port = "4000";
  return url.origin + "/";
}
