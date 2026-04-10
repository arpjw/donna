// Regulatory Sources
export interface RegulatorySource {
  id: string;
  name: string;
  slug: string;
  base_url: string;
  feed_url: string | null;
  jurisdiction: string;
  category: string;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

// Raw Documents
export interface RawDocument {
  id: string;
  source_id: string;
  external_id: string | null;
  title: string;
  full_text: string | null;
  document_url: string;
  document_type: string;
  published_at: string | null;
  fetched_at: string;
  is_processed: boolean;
  raw_metadata: Record<string, unknown> | null;
}

// Key Date
export interface KeyDate {
  label: string;
  date: string;
}

// Processed Documents
export interface ProcessedDocument {
  id: string;
  raw_document_id: string;
  plain_summary: string;
  detailed_summary: string;
  affected_industries: string[];
  affected_jurisdictions: string[];
  key_dates: KeyDate[];
  document_type: string;
  significance_score: number | null;
  significance_reasoning: string | null;
  taxonomy_tags: string[];
  recommended_actions: string | null;
  processed_at: string;
  llm_model_version: string | null;
  prompt_version: string | null;
  // Joined/enriched fields from backend (may be present when fetched with joins)
  headline?: string;
  change_id?: string;
  impact_level?: string;
  change_type?: string;
  source?: RegulatorySource;
  raw_title?: string;
  raw_document_url?: string;
  published_at?: string;
}

// Regulatory Changes
export type ImpactLevel = "high" | "medium" | "low";
export type ChangeType =
  | "proposed_rule"
  | "final_rule"
  | "amendment"
  | "enforcement_action"
  | "guidance_update";

export interface RegulatoryChange {
  id: string;
  processed_document_id: string;
  change_type: ChangeType;
  headline: string;
  impact_level: ImpactLevel;
  effective_date: string | null;
  comment_deadline: string | null;
  source_id: string;
  created_at: string;
  // Joined fields
  source?: RegulatorySource;
  processed_document?: ProcessedDocument;
}

// User Profile
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  company_size: string | null;
  industries: string[];
  jurisdictions: string[];
  watched_source_ids: string[];
  alert_threshold: "high" | "medium" | "all";
  digest_cadence: "daily" | "weekly";
  digest_day: string;
  digest_time: string;
  timezone: string;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Relevance Mapping
export interface RelevanceMapping {
  id: string;
  user_id: string;
  regulatory_change_id: string;
  relevance_score: number;
  relevance_reasoning: string;
  match_signals: Record<string, unknown>;
  user_feedback: string | null;
  created_at: string;
}

// Feed item (change + relevance)
export interface FeedItem {
  change: RegulatoryChange;
  relevance_score: number;
  relevance_reasoning: string;
}

// Alert
export type AlertStatus = "pending" | "sent" | "failed";

export interface Alert {
  id: string;
  user_id: string;
  regulatory_change_id: string;
  channel: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  status: AlertStatus;
  created_at: string;
  // Joined
  change?: RegulatoryChange;
}

// Digest
export interface Digest {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  headline: string;
  assembled_html: string;
  assembled_text: string;
  change_ids: string[];
  sent_at: string | null;
  status: string;
  created_at: string;
}

// API Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Document Annotations
export type AnnotationColor = "crimson" | "amber" | "green";

export interface DocumentAnnotation {
  id: string;
  user_id: string | null;
  processed_document_id: string | null;
  selected_text: string;
  note: string | null;
  color: AnnotationColor;
  char_start: number;
  char_end: number;
  created_at: string;
  updated_at: string;
}

// Compliance Tasks
export type TaskStatus = "open" | "in_progress" | "complete" | "dismissed";
export type TaskPriority = "high" | "medium" | "low";

export interface ComplianceTask {
  id: string;
  user_id: string | null;
  regulatory_change_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  change?: RegulatoryChange;
}

export interface TaskStats {
  open: number;
  in_progress: number;
  complete: number;
  overdue: number;
}

export interface TaskCreateRequest {
  regulatory_change_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
}

// Calendar Events
export type CalendarEventType =
  | "comment_deadline"
  | "effective_date"
  | "filing_deadline"
  | "review_date"
  | "custom";

export interface CalendarEvent {
  id: string;
  user_id: string | null;
  regulatory_change_id: string | null;
  processed_document_id: string | null;
  title: string;
  event_type: CalendarEventType;
  date: string; // ISO date string YYYY-MM-DD
  description: string | null;
  is_user_created: boolean;
  created_at: string;
  // Joined
  change?: RegulatoryChange;
}

export interface CalendarEventCreateRequest {
  title: string;
  event_type?: CalendarEventType;
  date: string;
  description?: string;
  regulatory_change_id?: string;
  processed_document_id?: string;
}

export interface CalendarEventUpdateRequest {
  title?: string;
  date?: string;
  description?: string;
  event_type?: CalendarEventType;
}

// Search
export interface SearchResult {
  processed_document: ProcessedDocument;
  change: RegulatoryChange;
  source: RegulatorySource;
  similarity_score: number;
}

export interface SearchFilters {
  industries?: string[];
  jurisdictions?: string[];
  document_types?: string[];
  date_from?: string;
  date_to?: string;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
}
