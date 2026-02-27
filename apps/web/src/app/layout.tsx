import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PromptHub - 프롬프트 템플릿 저장/공유",
  description: "AI 프롬프트 템플릿을 저장하고 공유하세요",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body>
        <Nav user={user} />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
