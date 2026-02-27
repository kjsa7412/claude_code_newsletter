export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  options?: string[];
  default?: string;
}

export interface TemplateMetadata {
  title: string;
  description?: string;
  fields: TemplateField[];
}

export interface Template {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  storage_path: string;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface RankingItem {
  rank: number;
  template_id: string;
  title: string;
  owner_display_name: string;
  use_count_weekly: number;
}

export interface CreateTemplateRequest {
  title: string;
  description?: string;
  is_public: boolean;
}

export interface UpdateTemplateRequest {
  title?: string;
  description?: string;
  is_public?: boolean;
}
