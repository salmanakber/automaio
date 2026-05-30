import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/webflow/designer', '/webflow/install']
  const isPublicWebflowAsset =
    /^\/webflow\/(runtime|embed|form-embed)\.js$/i.test(pathname) ||
    pathname === '/webflow/designer-extension.json' ||
    pathname.startsWith('/webflow/extension-shell')

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    isPublicWebflowAsset ||
    pathname.startsWith('/api/integrations/webflow/oauth') ||
    pathname.startsWith('/api/forms/public') ||
    pathname.startsWith('/api/public/embed') ||
    pathname.startsWith('/api/runtime/') ||
    pathname.startsWith('/webflow/embed/') ||
    pathname.startsWith('/webflow/form-embed')

  // Redirect unauthenticated users to login for protected routes
  if (
    !token &&
    !isPublicRoute &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/webflow/embed')
  ) {
    // API routes must return JSON — never an HTML login redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const login = new URL('/auth/login', request.url)
    const returnPath = `${pathname}${request.nextUrl.search}`
    if (returnPath && returnPath !== '/auth/login') {
      login.searchParams.set('redirect', returnPath)
    }
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
