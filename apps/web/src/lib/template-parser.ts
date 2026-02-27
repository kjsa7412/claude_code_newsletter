import matter from "gray-matter";
import yaml from "js-yaml";
import type { TemplateMetadata, TemplateField } from "@/types";

export interface ParsedTemplate {
  metadata: TemplateMetadata;
  body: string;
}

function normalizeField(raw: Record<string, unknown>): TemplateField {
  return {
    name: String(raw.name ?? ""),
    label: String(raw.label ?? raw.name ?? ""),
    type: (["text", "textarea", "select"].includes(String(raw.type))
      ? raw.type
      : "text") as TemplateField["type"],
    required: Boolean(raw.required ?? false),
    options: Array.isArray(raw.options)
      ? raw.options.map((o) => String(o))
      : undefined,
    default: raw.default !== undefined ? String(raw.default) : undefined,
  };
}

export function parseMdTemplate(content: string): ParsedTemplate {
  const { data, content: body } = matter(content);

  const rawFields = Array.isArray(data.fields) ? data.fields : [];

  const metadata: TemplateMetadata = {
    title: String(data.title ?? "Untitled"),
    description: data.description ? String(data.description) : undefined,
    fields: rawFields.map((f: unknown) =>
      normalizeField(f as Record<string, unknown>)
    ),
  };

  return { metadata, body: body.trim() };
}

export function substituteVariables(
  body: string,
  values: Record<string, string>
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    return varName in values ? values[varName] : match;
  });
}

export function serializeTemplate(
  metadata: TemplateMetadata,
  body: string
): string {
  const frontmatter = yaml.dump(
    {
      title: metadata.title,
      description: metadata.description,
      fields: metadata.fields.map((f) => {
        const field: Record<string, unknown> = {
          name: f.name,
          label: f.label,
          type: f.type,
        };
        if (f.required !== undefined) field.required = f.required;
        if (f.options !== undefined) field.options = f.options;
        if (f.default !== undefined) field.default = f.default;
        return field;
      }),
    },
    { lineWidth: -1 }
  );

  return `---\n${frontmatter}---\n${body}\n`;
}
