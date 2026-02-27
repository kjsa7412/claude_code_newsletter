"use client";

import { useState, useEffect } from "react";
import { substituteVariables } from "@/lib/template-parser";
import { recordUsage } from "@/lib/api";
import type { Template, TemplateMetadata } from "@/types";

interface TemplateRendererProps {
  template: Template;
  metadata: TemplateMetadata;
  body: string;
  token: string;
  currentUserId?: string;
  onClone?: () => void;
}

export default function TemplateRenderer({
  template,
  metadata,
  body,
  token,
  currentUserId,
  onClone,
}: TemplateRendererProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of metadata.fields) {
      init[field.name] = field.default ?? "";
    }
    return init;
  });

  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [usageRecorded, setUsageRecorded] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    setResult(substituteVariables(body, values));
  }, [body, values]);

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("클립보드 복사에 실패했습니다.");
    }
  }

  function handleDownload() {
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.title.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleRecordUsage() {
    if (usageRecorded) return;
    setUsageLoading(true);
    try {
      await recordUsage(token, template.id);
      setUsageRecorded(true);
    } catch (e) {
      console.error("Usage recording failed:", e);
    } finally {
      setUsageLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            template.is_public
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {template.is_public ? "공개" : "비공개"}
        </span>
        <span className="text-sm text-gray-500">
          사용 {template.use_count.toLocaleString()}회
        </span>
        {currentUserId !== template.owner_id && onClone && (
          <button
            onClick={onClone}
            className="btn-secondary text-xs"
          >
            내 계정으로 복제
          </button>
        )}
      </div>

      {/* 2-column layout */}
      <div className="md:flex gap-6">
        {/* Left: Input form */}
        <div className="flex-1 md:w-1/2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">입력값</h2>

          {metadata.fields.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-md">
              이 템플릿에는 입력 필드가 없습니다.
            </p>
          ) : (
            metadata.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label || field.name}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {field.type === "text" && (
                  <input
                    className="input-base"
                    value={values[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={`{{${field.name}}}`}
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    className="input-base min-h-[100px]"
                    value={values[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={`{{${field.name}}}`}
                  />
                )}

                {field.type === "select" && (
                  <select
                    className="input-base"
                    value={values[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Preview */}
        <div className="flex-1 md:w-1/2 space-y-2 mt-6 md:mt-0">
          <h2 className="text-sm font-semibold text-gray-700">
            결과 미리보기
          </h2>
          <textarea
            className="input-base min-h-[260px] font-mono text-sm bg-gray-50"
            value={result}
            readOnly
            placeholder="입력값을 채우면 여기에 치환된 프롬프트가 표시됩니다."
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleCopy}
          disabled={!result}
          className="btn-primary"
        >
          {copied ? "복사됨!" : "클립보드 복사"}
        </button>
        <button
          onClick={handleDownload}
          disabled={!result}
          className="btn-secondary"
        >
          다운로드 (.md)
        </button>
        <button
          onClick={handleRecordUsage}
          disabled={usageRecorded || usageLoading}
          className="btn-secondary"
        >
          {usageLoading
            ? "기록 중..."
            : usageRecorded
            ? "사용 기록됨"
            : "사용 기록"}
        </button>
      </div>
    </div>
  );
}
