"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getWeeklyRanking } from "@/lib/api";
import type { RankingItem } from "@/types";
import type { User } from "@supabase/supabase-js";

const MEDAL_CLASSES: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-gray-300 text-gray-700",
  3: "bg-amber-600 text-amber-100",
};

function RankBadge({ rank }: { rank: number }) {
  const colorClass =
    MEDAL_CLASSES[rank] ?? "bg-indigo-100 text-indigo-700";
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${colorClass}`}
    >
      {rank}
    </span>
  );
}

export default function RankingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        router.push("/");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function fetchRankings() {
      setLoading(true);
      setError(null);
      try {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data.session?.access_token ?? "";
        const data = await getWeeklyRanking(token);
        if (!cancelled) setRankings(data);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "랭킹을 불러오지 못했습니다."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRankings();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">주간 랭킹</h1>
        <p className="text-sm text-gray-500 mt-1">
          이번 주 가장 많이 사용된 공개 템플릿
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card p-4 h-16 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-center space-y-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            다시 시도
          </button>
        </div>
      ) : rankings.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-sm">
            이번 주 랭킹 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map((item) => (
            <Link
              key={item.template_id}
              href={`/templates/${item.template_id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <RankBadge rank={item.rank} />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.owner_display_name}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-indigo-600">
                  {item.use_count_weekly.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">사용/주</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
