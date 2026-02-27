"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTemplate, cloneTemplate } from "@/lib/api";
import { parseMdTemplate } from "@/lib/template-parser";
import TemplateRenderer from "@/components/TemplateRenderer";
import type { Template, TemplateMetadata } from "@/types";
import type { User } from "@supabase/supabase-js";

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [metadata, setMetadata] = useState<TemplateMetadata | null>(null);
  const [body, setBody] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (!u) {
        router.push("/");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await supabase.auth.getSession();
        const accessToken = sessionRes.data.session?.access_token ?? "";
        setToken(accessToken);

        const tmpl = await getTemplate(accessToken, id);
        setTemplate(tmpl);

        if (tmpl.storage_path) {
          const { data, error: dlError } = await supabase.storage
            .from("templates")
            .download(tmpl.storage_path);

          if (!dlError && data) {
            const text = await data.text();
            const parsed = parseMdTemplate(text);
            setMetadata(parsed.metadata);
            setBody(parsed.body);
          } else {
            setMetadata({
              title: tmpl.title,
              description: tmpl.description,
              fields: [],
            });
            setBody("");
          }
        } else {
          setMetadata({
            title: tmpl.title,
            description: tmpl.description,
            fields: [],
          });
          setBody("");
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

  async function handleClone() {
    setCloning(true);
    try {
      const cloned = await cloneTemplate(token, id);
      router.push(`/templates/${cloned.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "복제에 실패했습니다.");
    } finally {
      setCloning(false);
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
        <div className="card p-6 text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <Link href="/" className="btn-secondary text-sm inline-block">
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  if (!template || !metadata) return null;

  const isOwner = user?.id === template.owner_id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          홈
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">
          {template.title}
        </span>
        {isOwner && (
          <Link
            href={`/templates/${template.id}/edit`}
            className="ml-auto btn-secondary text-xs shrink-0"
          >
            수정
          </Link>
        )}
      </div>

      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
        {template.description && (
          <p className="text-gray-500 mt-1 text-sm">{template.description}</p>
        )}
      </div>

      {/* Renderer */}
      <div className="card p-6">
        <TemplateRenderer
          template={template}
          metadata={metadata}
          body={body}
          token={token}
          currentUserId={user?.id}
          onClone={cloning ? undefined : handleClone}
        />
      </div>
    </div>
  );
}
