import packageInfo from "../../package.json";
export const APP_EDITION = (packageInfo as { calibraEdition?: string }).calibraEdition === "classroom" ? "classroom" : "personal";
export const APP_VERSION = packageInfo.version;
export const IS_CLASSROOM = APP_EDITION === "classroom";
export const APP_NAME = IS_CLASSROOM ? "CALIBRA 다인·교육용" : "CALIBRA 개인용";
export const SESSION_COOKIE = IS_CLASSROOM ? "calibra_classroom_session" : "calibra_session";
export function appCookie(name: "google_state" | "google_nonce" | "approval_ticket") { return `${IS_CLASSROOM ? "calibra_classroom" : "calibra"}_${name}`; }
