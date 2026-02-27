"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getTemplate, updateTemplate } from "@/lib/api";
import { parseMdTemplate, serializeTemplate } from "@/lib/template-parser";
import TemplateEditor from "@/components/TemplateEditor";
import type { Template, TemplateMetadata } from "@/types";
import type { User } from "@supabase/supabase-js";

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [initialMetadata, setInitialMetadata] =
    useState<TemplateMetadata | null>(null);
  const [initialBody, setInitialBody] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data.session?.access_token ?? "";
        const tmpl = await getTemplate(token, id);
        setTemplate(tmpl);

        if (tmpl.storage_path) {
          const { data, error: dlError } = await supabase.storage
            .from("templates")
            .download(tmpl.storage_path);

          if (!dlError && data) {
            const text = await data.text();
            const parsed = parseMdTemplate(text);
            setInitialMetadata(parsed.metadata);
            setInitialBody(parsed.body);
          } else {
            setInitialMetadata({
              title: tmpl.title,
              description: tmpl.description,
              fields: [],
            });
          }
        } else {
          setInitialMetadata({
            title: tmpl.title,
            description: tmpl.description,
            fields: [],
          });
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "템플릿을 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(data: {
    title: string;
    description: string;
    is_public: boolean;
    metadata: TemplateMetadata;
    body: string;
  }) {
    if (!user || !template) return;
    setSaving(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token ?? "";

      const mdContent = serializeTemplate(data.metadata, data.body);
      const storagePath = `${user.id}/${template.id}.md`;

      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(storagePath, new Blob([mdContent], { type: "text/markdown" }), {
          upsert: true,
        });

      if (uploadError) {
        console.warn("Storage upload error (non-fatal):", uploadError.message);
      }

      await updateTemplate(token, template.id, {
        title: data.title,
        description: data.description || undefined,
        is_public: data.is_public,
      });

      router.push(`/templates/${template.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!template || !initialMetadata) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">템플릿 수정</h1>
        <p className="text-sm text-gray-500 mt-1">{template.title}</p>
      </div>
      <TemplateEditor
        initialTitle={initialMetadata.title}
        initialDescription={initialMetadata.description ?? ""}
        initialIsPublic={template.is_public}
        initialFields={initialMetadata.fields}
        initialBody={initialBody}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
