import type {
  Template,
  RankingItem,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function getTemplates(
  token: string,
  filter?: "mine" | "public"
): Promise<Template[]> {
  const query = filter ? `?filter=${filter}` : "";
  return apiFetch<Template[]>(`/api/templates${query}`, token);
}

export async function createTemplate(
  token: string,
  data: CreateTemplateRequest
): Promise<Template> {
  return apiFetch<Template>("/api/templates", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTemplate(
  token: string,
  id: string
): Promise<Template> {
  return apiFetch<Template>(`/api/templates/${id}`, token);
}

export async function updateTemplate(
  token: string,
  id: string,
  data: UpdateTemplateRequest
): Promise<Template> {
  return apiFetch<Template>(`/api/templates/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(
  token: string,
  id: string
): Promise<void> {
  return apiFetch<void>(`/api/templates/${id}`, token, {
    method: "DELETE",
  });
}

export async function cloneTemplate(
  token: string,
  id: string
): Promise<Template> {
  return apiFetch<Template>(`/api/templates/${id}/clone`, token, {
    method: "POST",
  });
}

export async function recordUsage(
  token: string,
  templateId: string
): Promise<void> {
  return apiFetch<void>(`/api/usage`, token, {
    method: "POST",
    body: JSON.stringify({ template_id: templateId }),
  });
}

export async function getWeeklyRanking(
  token: string
): Promise<RankingItem[]> {
  return apiFetch<RankingItem[]>("/api/rankings/weekly", token);
}
