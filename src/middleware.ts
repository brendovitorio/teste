import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting storage (em produção, prefira Redis ou DB)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(ip);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;

  current.count++;
  return true;
}

// Headers de segurança
function addSecurityHeaders(res: NextResponse) {
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;"
  );
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

export async function middleware(req: NextRequest) {

  const ignorePaths = /_next\/static|_next\/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$/;
  if (req.nextUrl.pathname.match(ignorePaths)) return NextResponse.next();

  // Ignora arquivos estáticos
  const staticFiles = /_next\/static|_next\/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$/;
  if (req.nextUrl.pathname.match(staticFiles)) return NextResponse.next();

  const res = NextResponse.next();
  const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const isProd = process.env.NODE_ENV === 'production';

  // Rate limit apenas para produção e rotas sensíveis
  const protectedRateLimitPaths = ['/auth/', '/api/auth/'];
  if (isProd && protectedRateLimitPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    // limite baixo, ex: 10 requests por minuto
    if (!rateLimit(ip, 10, 60000)) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }


  // Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value || '';
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', options);
        },
      },
    }
  );

  // Pega user a partir dos cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('User in middleware:', user?.email || null);

  const protectedPaths = ['/dashboard', '/funcionarios', '/configuracoes'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // Redireciona se não estiver logado
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redireciona para dashboard se já logado
  if ((req.nextUrl.pathname.startsWith('/auth/login') || req.nextUrl.pathname.startsWith('/auth/register')) && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
