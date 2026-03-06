import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. 토큰 확인
  const accessToken = request.cookies.get("bkend_access_token")?.value;
  const refreshToken = request.cookies.get("bkend_refresh_token")?.value;

  // 3. 토큰이 아예 없으면 로그인 페이지로 이동
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. 액세스 토큰은 만료되었지만 리프레시 토큰이 있는 경우 (자동 갱신 로직 가능)
  // 여기서는 간단하게 통과시키거나, 실제 API를 호출하여 갱신할 수 있음
  
  return NextResponse.next();
}

export const config = {
  // 정적 파일, 이미지 등을 제외한 모든 경로에 미들웨어 적용
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
