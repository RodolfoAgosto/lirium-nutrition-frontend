// Demo-grade session handling: tokens live in localStorage, the JWT payload
// is decoded on the client (there is no "me" endpoint in the API).

const TOKEN_KEY = "lirium.token";
const REFRESH_KEY = "lirium.refreshToken";

export type Session = { email: string; roles: string[] };

const isBrowser = () => typeof window !== "undefined";

export const auth = {
  getToken(): string | null {
    return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
  },
  setTokens(token: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  getSession(): Session | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = decodeJwt(token);
    if (!payload || typeof payload.sub !== "string") return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    const roles = Array.isArray(payload.roles) ? (payload.roles as string[]) : [];
    return { email: payload.sub, roles };
  },
};

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
