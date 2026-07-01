import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// NOTE: this Next.js version renamed `middleware.ts` to `proxy.ts` (the
// exported function must be named `proxy`, not `middleware`) — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md

const publicRoutes = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // /api is excluded: those routes return their own 401 JSON instead of a
  // redirect, since redirecting a fetch() call would hand SWR an HTML body.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
