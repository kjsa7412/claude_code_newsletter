"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTemplates, deleteTemplate } from "@/lib/api";
import TemplateCard from "@/components/TemplateCard";
import type { Template } from "@/types";
import type { User } from "@supabase/supabase-js";

type FilterType = "mine" | "public";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("mine");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token ?? "";
        const data = await getTemplates(token, filter);
        if (!cancelled) setTemplates(data);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "템플릿을 불러오지 못했습니다."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTemplates();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  async function handleDelete(id: string) {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token ?? "";
      await deleteTemplate(token, id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  }

  async function handleRetry() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token ?? "";
      const data = await getTemplates(token, filter);
      setTemplates(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "템플릿을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-3">PromptHub</h1>
        <p className="text-gray-500 mb-8">
          AI 프롬프트 템플릿을 저장하고 공유하세요
        </p>
        <p className="text-sm text-gray-400">
          서비스를 이용하려면 로그인이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">템플릿</h1>
        <Link href="/templates/new" className="btn-primary">
          + 새 템플릿
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["mine", "public"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "mine" ? "내 템플릿" : "공개 템플릿"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-36 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button onClick={handleRetry} className="btn-secondary text-sm">
            다시 시도
          </button>
        </div>
      ) : templates.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">
            {filter === "mine"
              ? "아직 만든 템플릿이 없습니다."
              : "공개된 템플릿이 없습니다."}
          </p>
          {filter === "mine" && (
            <Link href="/templates/new" className="btn-primary text-sm">
              첫 템플릿 만들기
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              currentUserId={user.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
