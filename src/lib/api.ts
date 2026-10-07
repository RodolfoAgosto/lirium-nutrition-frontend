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

export type PatientSummary = { patientId: number; firstName: string; lastName: string; email: string; dni: string | null };

export type PatientDetail = PatientSummary & {
  sex: string | null;
  birthDate: string | null;
  // Value objects: the API may send a number or an object depending on serialization.
  height: number | { cm: number } | null;
  weight: number | { grams: number } | null;
  activityLevel: string | null;
  goal: string | null;
  medicalNotes: string | null;
  restrictions: { id: number; code: string; name: string; category: string }[];
  physiologicalConditions: string[];
};

export type PlanSummary = {
  id: number;
  name: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  targetGoal: string | null;
  dailyCalories: number;
  startDate: string | null;
  endDate: string | null;
};

export type PlanPortion = {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PlanDetail = {
  id: number;
  name: string;
  description: string | null;
  status: PlanSummary["status"];
  targetGoal: string | null;
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  week: { dayOfWeek: string; meals: { type: string; portions: PlanPortion[] }[] }[];
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

  searchPatients: () => request<PatientSummary[]>("/api/patients/search", { authenticated: true }),

  getPatient: (id: number) => request<PatientDetail>(`/api/patients/${id}`, { authenticated: true }),

  getPatientPlans: (patientId: number) =>
    request<PlanSummary[]>(`/api/patients/${patientId}/nutrition-plans`, { authenticated: true }),

  getPlan: (id: number) => request<PlanDetail>(`/api/nutrition-plans/${id}`, { authenticated: true }),

  generatePlan: (patientId: number) =>
    request<PlanDetail>(`/api/nutrition-plans/generate/${patientId}`, { method: "POST", authenticated: true }),

  activatePlan: (id: number) =>
    request<void>(`/api/nutrition-plans/${id}/activate`, { method: "PATCH", authenticated: true }),
};
