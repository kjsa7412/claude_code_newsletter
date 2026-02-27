import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        인증 오류
      </h1>
      <p className="text-gray-500 mb-8">
        로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.
      </p>
      <Link href="/" className="btn-primary">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
