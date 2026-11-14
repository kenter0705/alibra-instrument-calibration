import packageInfo from "../../package.json";
export const APP_EDITION = (packageInfo as { calibraEdition?: string }).calibraEdition === "classroom" ? "classroom" : "personal";
export const APP_VERSION = packageInfo.version;
export const IS_CLASSROOM = APP_EDITION === "classroom";
export const APP_NAME = IS_CLASSROOM ? "CALIBRA 멀티" : "CALIBRA 퍼스널";
export const SESSION_COOKIE = IS_CLASSROOM ? "calibra_classroom_session" : "calibra_session";
export function appCookie(name: "google_state" | "google_nonce" | "approval_ticket") { return `${IS_CLASSROOM ? "calibra_classroom" : "calibra"}_${name}`; }

export const APP_RELEASE_DATE = (packageInfo as { calibraReleaseDate?: string }).calibraReleaseDate || "2026-11-12";
export const APP_RELEASE_TAG = IS_CLASSROOM ? `classroom-v${APP_VERSION}` : `v${APP_VERSION}`;
export const APP_ASSET_PREFIX = IS_CLASSROOM ? "CALIBRA-Multi" : "CALIBRA-Personal";
export const APP_DOWNLOAD_URL = `https://github.com/kenter0705/alibra-instrument-calibration/releases/download/${APP_RELEASE_TAG}/${APP_ASSET_PREFIX}-Setup-v${APP_VERSION}-${APP_RELEASE_DATE.replaceAll("-","")}.zip`;
