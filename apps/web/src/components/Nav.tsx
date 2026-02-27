"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface NavProps {
  user: User | null;
}

export default function Nav({ user }: NavProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              PromptHub
            </Link>
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                홈
              </Link>
              <Link
                href="/rankings"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                랭킹
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[180px]">
                  {user.email}
                </span>
                <Link href="/templates/new" className="btn-primary text-xs sm:text-sm">
                  + 새 템플릿
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-xs sm:text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={handleLogin} className="btn-primary text-sm">
                Google로 로그인
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
