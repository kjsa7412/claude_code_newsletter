export default function GuidePanel() {
  return (
    <div className="card p-5 text-sm sticky top-20">
      <h2 className="font-bold text-gray-900 mb-3">
        프롬프트 엔지니어링 가이드
      </h2>
      <hr className="border-gray-200 mb-4" />

      <div className="mb-4">
        <p className="font-semibold text-gray-700 mb-2">체크리스트</p>
        <ul className="space-y-2.5 text-gray-600">
          <li className="flex gap-2">
            <span className="shrink-0 text-gray-400">□</span>
            <span>
              <span className="font-medium text-gray-800">역할 지정 (Role)</span>
              <br />
              <span className="text-xs text-gray-500">
                예: &quot;당신은 시니어 마케터입니다.&quot;
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-gray-400">□</span>
            <span>
              <span className="font-medium text-gray-800">맥락 제공 (Context)</span>
              <br />
              <span className="text-xs text-gray-500">
                배경 정보와 목적을 명확히 기술
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-gray-400">□</span>
            <span>
              <span className="font-medium text-gray-800">
                예시 포함 (Examples / Few-shot)
              </span>
              <br />
              <span className="text-xs text-gray-500">
                원하는 출력 예시 1-3개 제공
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-gray-400">□</span>
            <span>
              <span className="font-medium text-gray-800">출력 형식 명시 (Format)</span>
              <br />
              <span className="text-xs text-gray-500">
                예: JSON, 마크다운, 불릿 리스트
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-gray-400">□</span>
            <span>
              <span className="font-medium text-gray-800">
                제약조건 설정 (Constraints)
              </span>
              <br />
              <span className="text-xs text-gray-500">
                길이, 언어, 포함/제외 조건
              </span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-gray-400">□</span>
            <span>
              <span className="font-medium text-gray-800">톤/스타일 지정 (Tone)</span>
              <br />
              <span className="text-xs text-gray-500">
                예: 친근한, 전문적인, 간결한
              </span>
            </span>
          </li>
        </ul>
      </div>

      <hr className="border-gray-200 mb-4" />

      <div>
        <p className="font-semibold text-gray-700 mb-2">팁</p>
        <ul className="space-y-1.5 text-gray-600 text-xs">
          <li className="flex gap-1.5">
            <span className="text-indigo-500 shrink-0">•</span>
            <span>
              <code className="bg-indigo-50 text-indigo-700 px-1 rounded">
                {"{{변수명}}"}
              </code>{" "}
              으로 입력 변수 선언
            </span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-indigo-500 shrink-0">•</span>
            <span>구체적일수록 좋은 결과</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-indigo-500 shrink-0">•</span>
            <span>복잡한 작업은 단계별로 분리</span>
          </li>
          <li className="flex gap-1.5">
            <span className="text-indigo-500 shrink-0">•</span>
            <span>Fields에 추가한 변수명과 Body의 {"{{변수명}}"} 이 일치해야 치환됩니다</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
