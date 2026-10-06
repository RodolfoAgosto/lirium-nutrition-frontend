import { auth } from "./auth";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://lirium-nutrition-planning-api.onrender.com"
).replace(/\/$/, "");

// Shape returned by the backend for every error (see ApiError.java).
type ApiErrorBody = {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { authenticated?: boolean } = {}): Promise<T> {
  const { authenticated, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (authenticated) {
    const token = auth.getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...rest, headers: finalHeaders });
  } catch {
    throw new ApiError(0, "Cannot reach the server. It may be waking up, please try again in a few seconds.");
  }

  if (!res.ok) {
    let message = `Unexpected error (${res.status})`;
    try {
      const body = (await res.json()) as Partial<ApiErrorBody>;
      if (body.message) message = body.message;
    } catch {
      /* keep default message */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type AuthTokens = { token: string; refreshToken: string };

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export const api = {
  login: (email: string, password: string) =>
    request<AuthTokens>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (input: RegisterInput) =>
    request<unknown>("/api/users", { method: "POST", body: JSON.stringify(input) }),

  exchangeOAuthCode: (code: string) =>
    request<AuthTokens>("/api/auth/oauth2/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  logout: () => request<void>("/api/auth/logout", { method: "POST", authenticated: true }),

  googleLoginUrl: `${API_URL}/oauth2/authorization/google`,
};
