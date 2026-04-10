import type {
  PaginatedResponse,
  ProcessedDocument,
  RegulatoryChange,
  RegulatorySource,
  UserProfile,
  Alert,
  Digest,
  SearchRequest,
  SearchResult,
  FeedItem,
  ComplianceTask,
  TaskStats,
  TaskCreateRequest,
  TaskUpdateRequest,
  DocumentAnnotation,
  AnnotationColor,
  CalendarEvent,
  CalendarEventCreateRequest,
  CalendarEventUpdateRequest,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail ?? body.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

// Documents
export const documentsApi = {
  list: (
    params: {
      page?: number;
      page_size?: number;
      source_id?: string;
      document_type?: string;
      impact_level?: string;
      date_from?: string;
      date_to?: string;
    },
    token?: string
  ) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    return apiFetch<PaginatedResponse<ProcessedDocument>>(
      `/api/documents?${qs}`,
      {},
      token
    );
  },

  get: (id: string, token?: string) =>
    apiFetch<ProcessedDocument>(`/api/documents/${id}`, {}, token),

  related: (id: string, token?: string) =>
    apiFetch<SearchResult[]>(`/api/documents/${id}/related`, {}, token),
};

// Changes
export const changesApi = {
  list: (
    params: {
      page?: number;
      page_size?: number;
      impact_level?: string;
      source_id?: string;
    },
    token?: string
  ) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    return apiFetch<PaginatedResponse<FeedItem>>(`/api/changes?${qs}`, {}, token);
  },

  get: (id: string, token?: string) =>
    apiFetch<RegulatoryChange>(`/api/changes/${id}`, {}, token),
};

// Search
export const searchApi = {
  search: (body: SearchRequest, token?: string) =>
    apiFetch<SearchResult[]>("/api/search", {
      method: "POST",
      body: JSON.stringify(body),
    }, token),
};

// Alerts
export const alertsApi = {
  list: (token?: string) =>
    apiFetch<PaginatedResponse<Alert>>("/api/alerts", {}, token),

  feedback: (
    id: string,
    feedback: "relevant" | "not_relevant",
    token?: string
  ) =>
    apiFetch<void>(
      `/api/alerts/${id}/feedback`,
      { method: "PATCH", body: JSON.stringify({ feedback }) },
      token
    ),
};

// Digests
export const digestsApi = {
  list: (token?: string) =>
    apiFetch<PaginatedResponse<Digest>>("/api/digests", {}, token),

  get: (id: string, token?: string) =>
    apiFetch<Digest>(`/api/digests/${id}`, {}, token),
};

// Users
export const usersApi = {
  me: (token?: string) =>
    apiFetch<UserProfile>("/api/users/me", {}, token),

  update: (data: Partial<UserProfile>, token?: string) =>
    apiFetch<UserProfile>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }, token),

  onboard: (data: Partial<UserProfile>, token?: string) =>
    apiFetch<UserProfile>("/api/users/me/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),
};

// Annotations
export const annotationsApi = {
  list: (documentId: string, token?: string) =>
    apiFetch<DocumentAnnotation[]>(`/api/annotations?document_id=${documentId}`, {}, token),

  create: (
    data: {
      processed_document_id: string;
      selected_text: string;
      note?: string;
      color?: AnnotationColor;
      char_start: number;
      char_end: number;
    },
    token?: string
  ) =>
    apiFetch<DocumentAnnotation>("/api/annotations", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  update: (
    id: string,
    data: { note?: string | null; color?: AnnotationColor },
    token?: string
  ) =>
    apiFetch<DocumentAnnotation>(`/api/annotations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  delete: (id: string, token?: string) =>
    apiFetch<void>(`/api/annotations/${id}`, { method: "DELETE" }, token),
};

// Tasks
export const tasksApi = {
  list: (
    params: {
      status?: string;
      priority?: string;
      due_before?: string;
      due_after?: string;
      page?: number;
      page_size?: number;
    },
    token?: string
  ) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    return apiFetch<PaginatedResponse<ComplianceTask>>(`/api/tasks?${qs}`, {}, token);
  },

  stats: (token?: string) =>
    apiFetch<TaskStats>("/api/tasks/stats", {}, token),

  get: (id: string, token?: string) =>
    apiFetch<ComplianceTask>(`/api/tasks/${id}`, {}, token),

  create: (data: TaskCreateRequest, token?: string) =>
    apiFetch<ComplianceTask>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  update: (id: string, data: TaskUpdateRequest, token?: string) =>
    apiFetch<ComplianceTask>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  delete: (id: string, token?: string) =>
    apiFetch<void>(`/api/tasks/${id}`, { method: "DELETE" }, token),
};

// Sources
export const sourcesApi = {
  list: (token?: string) =>
    apiFetch<RegulatorySource[]>("/api/sources", {}, token),
};

// Calendar
export const calendarApi = {
  list: (
    params: { from_date?: string; to_date?: string; event_type?: string } = {},
    token?: string
  ) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    return apiFetch<CalendarEvent[]>(`/api/calendar/events?${qs}`, {}, token);
  },

  create: (data: CalendarEventCreateRequest, token?: string) =>
    apiFetch<CalendarEvent>("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  update: (id: string, data: CalendarEventUpdateRequest, token?: string) =>
    apiFetch<CalendarEvent>(`/api/calendar/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  delete: (id: string, token?: string) =>
    apiFetch<void>(`/api/calendar/events/${id}`, { method: "DELETE" }, token),
};
