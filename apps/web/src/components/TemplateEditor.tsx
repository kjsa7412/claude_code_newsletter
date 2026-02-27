"use client";

import { useState } from "react";
import GuidePanel from "./GuidePanel";
import type { TemplateField, TemplateMetadata } from "@/types";

interface TemplateEditorProps {
  initialTitle?: string;
  initialDescription?: string;
  initialIsPublic?: boolean;
  initialFields?: TemplateField[];
  initialBody?: string;
  saving?: boolean;
  onSave: (data: {
    title: string;
    description: string;
    is_public: boolean;
    metadata: TemplateMetadata;
    body: string;
  }) => void;
}

const emptyField = (): TemplateField => ({
  name: "",
  label: "",
  type: "text",
  required: false,
});

export default function TemplateEditor({
  initialTitle = "",
  initialDescription = "",
  initialIsPublic = false,
  initialFields = [],
  initialBody = "",
  saving = false,
  onSave,
}: TemplateEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [fields, setFields] = useState<TemplateField[]>(
    initialFields.length > 0 ? initialFields : []
  );
  const [body, setBody] = useState(initialBody);

  function addField() {
    setFields((prev) => [...prev, emptyField()]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<TemplateField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  }

  function handleSave() {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      is_public: isPublic,
      metadata: {
        title: title.trim(),
        description: description.trim() || undefined,
        fields,
      },
      body,
    });
  }

  return (
    <div className="md:flex gap-6">
      {/* Left: Editor */}
      <div className="flex-1 md:w-2/3 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            className="input-base"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="템플릿 제목"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <input
            className="input-base"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 템플릿에 대한 간략한 설명"
          />
        </div>

        {/* is_public toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isPublic ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isPublic ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {isPublic ? "공개 템플릿" : "비공개 템플릿"}
          </span>
          <span className="text-xs text-gray-400">
            {isPublic ? "갤러리/랭킹에 노출됩니다" : "나만 볼 수 있습니다"}
          </span>
        </div>

        {/* Fields */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              입력 필드
            </label>
            <button
              type="button"
              onClick={addField}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              + 필드 추가
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-md">
              필드가 없습니다. &quot;+ 필드 추가&quot;를 눌러 추가하세요.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    필드 #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      변수명 (name)
                    </label>
                    <input
                      className="input-base text-xs"
                      value={field.name}
                      onChange={(e) =>
                        updateField(index, { name: e.target.value })
                      }
                      placeholder="예: topic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      라벨 (label)
                    </label>
                    <input
                      className="input-base text-xs"
                      value={field.label}
                      onChange={(e) =>
                        updateField(index, { label: e.target.value })
                      }
                      placeholder="예: 주제"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      타입
                    </label>
                    <select
                      className="input-base text-xs"
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, {
                          type: e.target.value as TemplateField["type"],
                        })
                      }
                    >
                      <option value="text">text</option>
                      <option value="textarea">textarea</option>
                      <option value="select">select</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required ?? false}
                        onChange={(e) =>
                          updateField(index, { required: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-medium text-gray-600">
                        필수
                      </span>
                    </label>
                  </div>
                </div>

                {field.type === "select" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      옵션 (쉼표로 구분)
                    </label>
                    <input
                      className="input-base text-xs"
                      value={(field.options ?? []).join(", ")}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="예: formal, casual, technical"
                    />
                  </div>
                )}

                {field.type === "select" && (field.options ?? []).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      기본값
                    </label>
                    <select
                      className="input-base text-xs"
                      value={field.default ?? ""}
                      onChange={(e) =>
                        updateField(index, { default: e.target.value })
                      }
                    >
                      <option value="">선택 안 함</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            프롬프트 본문
          </label>
          <p className="text-xs text-gray-400 mb-2">
            {"{{변수명}}"} 형식으로 변수를 삽입하세요
          </p>
          <textarea
            className="input-base min-h-[200px] font-mono text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`예:\n{{topic}}에 대한 {{tone}} 스타일의 블로그 포스트를 작성해줘.`}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* Right: Guide */}
      <div className="hidden md:block md:w-1/3">
        <GuidePanel />
      </div>
    </div>
  );
}
