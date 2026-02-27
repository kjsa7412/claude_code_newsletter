"use client";

import Link from "next/link";
import { useState } from "react";
import type { Template } from "@/types";

interface TemplateCardProps {
  template: Template;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TemplateCard({
  template,
  currentUserId,
  onDelete,
}: TemplateCardProps) {
  const isOwner = currentUserId === template.owner_id;
  const [deleting, setDeleting] = useState(false);

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    setDeleting(true);
    onDelete?.(template.id);
  }

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/templates/${template.id}`}
          className="flex-1 min-w-0"
        >
          <h3 className="font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">
            {template.title}
          </h3>
        </Link>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            template.is_public
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {template.is_public ? "공개" : "비공개"}
        </span>
      </div>

      {template.description && (
        <p className="text-sm text-gray-500 line-clamp-2">
          {template.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>사용 {template.use_count.toLocaleString()}회</span>
          <span>{formatDate(template.created_at)}</span>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              href={`/templates/${template.id}/edit`}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? "삭제중..." : "삭제"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
