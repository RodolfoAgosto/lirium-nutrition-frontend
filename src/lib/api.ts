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

async function requestWithStatus<T>(
  path: string,
  init: RequestInit & { authenticated?: boolean } = {},
): Promise<{ body: T; status: number }> {
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

  if (res.status === 204) return { body: undefined as T, status: res.status };
  return { body: (await res.json()) as T, status: res.status };
}

async function request<T>(path: string, init: RequestInit & { authenticated?: boolean } = {}): Promise<T> {
  return (await requestWithStatus<T>(path, init)).body;
}

// "?from=2026-09-01&to=2026-09-30"; both bounds are optional (the API defaults to the last 30 days).
function rangeQuery(range?: { from?: string; to?: string }): string {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  const q = params.toString();
  return q ? `?${q}` : "";
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
  id: number;
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
  week: {
    id: number;
    dayOfWeek: string;
    totals: { calories: number; protein: number; carbs: number; fat: number };
    meals: { id: number; type: string; portions: PlanPortion[] }[];
  }[];
};

export type MeasureUnit = "GRAM" | "MILLILITER" | "UNIT";

// Catalog entry. defaultUnit is the unit the food is normally measured in; the API
// rejects a portion whose unit the food cannot convert to grams.
export type FoodSummary = { id: number; name: string; defaultUnit: MeasureUnit | null };

// What the patient actually ate, as the API reports it (see DailyRecordResponseDTO).
export type RecordPortion = {
  id: number;
  foodName: string;
  quantity: number;
  unit: MeasureUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type RecordMeal = {
  id: number;
  type: string;
  // True once the patient changed the meal (added food or wrote a note).
  overridden: boolean;
  notes: string | null;
  eatenAt: string | null;
  portions: RecordPortion[];
};

export type DailyRecord = { id: number; date: string; meals: RecordMeal[] };

export type Nutrients = { calories: number; protein: number; carbs: number; fat: number };

export type NutritionScore = Nutrients & { overall: number };

export type AdherenceReport = {
  from: string;
  to: string;
  summary: {
    totalDays: number;
    recordedDays: number;
    expectedMeals: number;
    followedMeals: number;
    adherence: number;
    adherenceOnRecordedDays: number | null;
  };
  days: {
    date: string;
    hasRecord: boolean;
    expectedMeals: number;
    followedMeals: number | null;
    modifiedMeals: number | null;
  }[];
};

export type NutritionComparisonReport = {
  from: string;
  to: string;
  targets: Nutrients;
  summary: {
    totalDays: number;
    recordedDays: number;
    averageScore: NutritionScore | null;
    averageConsumed: Nutrients | null;
  };
  days: {
    date: string;
    hasRecord: boolean;
    planned: Nutrients;
    consumed: Nutrients | null;
    score: NutritionScore | null;
  }[];
};

// ensureDailyRecord answers 200 when the day already existed and 201 when it was just created.
export type EnsuredRecord = { record: DailyRecord; created: boolean };

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

  // ---- Patient side ----------------------------------------------------------
  // The JWT carries no user id, so a patient asks the API who they are.
  getMyProfile: () => request<PatientDetail>("/api/patients/me", { authenticated: true }),

  getActivePlan: (patientId: number) =>
    request<PlanDetail>(`/api/patients/${patientId}/nutrition-plans/active`, { authenticated: true }),

  // Get-or-create: opens the day (today when no date is given) from the active plan.
  ensureDailyRecord: async (patientId: number, date?: string): Promise<EnsuredRecord> => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const { body, status } = await requestWithStatus<DailyRecord>(
      `/api/patients/${patientId}/daily-records/ensure${query}`,
      { method: "POST", authenticated: true },
    );
    return { record: body, created: status === 201 };
  },

  getFoods: () => request<FoodSummary[]>("/api/foods", { authenticated: true }),

  addPortion: (mealRecordId: number, input: { foodId: number; quantity: number; unit: MeasureUnit }) =>
    request<RecordMeal>(`/api/daily-records/meals/${mealRecordId}/portions`, {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: true,
    }),

  removePortion: (dailyRecordId: number, mealRecordId: number, portionId: number) =>
    request<void>(`/api/daily-records/${dailyRecordId}/meals/${mealRecordId}/portions/${portionId}`, {
      method: "DELETE",
      authenticated: true,
    }),

  updateMealNotes: (mealRecordId: number, notes: string) =>
    request<RecordMeal>(`/api/daily-records/meals/${mealRecordId}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
      authenticated: true,
    }),

  getAdherence: (patientId: number, range?: { from?: string; to?: string }) =>
    request<AdherenceReport>(`/api/patients/${patientId}/daily-records/meal-adherence${rangeQuery(range)}`, {
      authenticated: true,
    }),

  getNutritionComparison: (patientId: number, range?: { from?: string; to?: string }) =>
    request<NutritionComparisonReport>(
      `/api/patients/${patientId}/daily-records/nutrition-comparison${rangeQuery(range)}`,
      { authenticated: true },
    ),
};
