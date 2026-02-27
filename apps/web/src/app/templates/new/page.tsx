"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTemplate } from "@/lib/api";
import { serializeTemplate } from "@/lib/template-parser";
import TemplateEditor from "@/components/TemplateEditor";
import type { TemplateMetadata } from "@/types";
import type { User } from "@supabase/supabase-js";

export default function NewTemplatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(data: {
    title: string;
    description: string;
    is_public: boolean;
    metadata: TemplateMetadata;
    body: string;
  }) {
    if (!user) return;
    setSaving(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token ?? "";

      // 1. Create template record via Spring API (server generates storage_path)
      const template = await createTemplate(token, {
        title: data.title,
        description: data.description || undefined,
        is_public: data.is_public,
      });

      // 2. Serialize .md content
      const mdContent = serializeTemplate(data.metadata, data.body);

      // 3. Upload .md to Supabase Storage at the server-assigned path
      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(
          template.storage_path,
          new Blob([mdContent], { type: "text/markdown" }),
          { upsert: true }
        );

      if (uploadError) {
        console.warn("Storage upload error (non-fatal):", uploadError.message);
      }

      router.push(`/templates/${template.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-sm">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 템플릿</h1>
        <p className="text-sm text-gray-500 mt-1">
          프롬프트 템플릿을 작성하고 저장하세요
        </p>
      </div>
      <TemplateEditor onSave={handleSave} saving={saving} />
    </div>
  );
}
