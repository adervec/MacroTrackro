import type {
  DayView,
  Food,
  FoodInput,
  Goals,
  LogEntryInput,
  Meal,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the default message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  getDay: (date: string) => request<DayView>(`/api/log?date=${encodeURIComponent(date)}`),

  addEntry: (input: LogEntryInput) =>
    request<DayView>("/api/log", { method: "POST", body: JSON.stringify(input) }),

  updateEntry: (id: string, patch: { servings?: number; meal?: Meal }) =>
    request<DayView>(`/api/log/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteEntry: (id: string) => request<DayView>(`/api/log/${id}`, { method: "DELETE" }),

  searchFoods: (q: string) =>
    request<Food[]>(`/api/foods?q=${encodeURIComponent(q)}`),

  createFood: (input: FoodInput) =>
    request<Food>("/api/foods", { method: "POST", body: JSON.stringify(input) }),

  getGoals: () => request<Goals>("/api/goals"),

  saveGoals: (goals: Goals) =>
    request<Goals>("/api/goals", { method: "PUT", body: JSON.stringify(goals) }),
};
