import { NextResponse } from 'next/server';

// 静的エクスポート時はmiddlewareは実行されません
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
