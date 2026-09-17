import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OWNER_EMAILS } from "@/lib/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://stjizeqqokjyssrerwyd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aml6ZXFxb2tqeXNzcmVyd3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTE1MDgsImV4cCI6MjEwNTA2NzUwOH0.XQBc8bbNY9Kmz8x4s4gMQNbu0CV0l3lx7YeeVcPA6VU";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/avaliador/login";
  const isAdminPage = path === "/avaliador/admin";
  const isSuspensaPage = path === "/licenca-suspensa";
  const isAvaliadorRoute = path.startsWith("/avaliador") && !isLoginPage;
  const isPacienteRoute = path.startsWith("/paciente");

  // 1) Login de avaliador continua exigido normalmente.
  if (isAvaliadorRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/avaliador/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  const isOwner = !!user?.email && OWNER_EMAILS.includes(user.email);

  // 2) A página de administração da licença é sempre restrita ao(s)
  // e-mail(s) responsável(is), independente do estado da licença - é o
  // controle que precisa continuar acessível mesmo com a licença suspensa.
  if (isAdminPage) {
    if (!isOwner) {
      const url = request.nextUrl.clone();
      url.pathname = "/avaliador";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 3) Checagem de licença - só roda quando realmente importa, para não
  // gastar uma consulta em toda requisição.
  if (isPacienteRoute || isAvaliadorRoute) {
    const { data: licenca } = await supabase.from("licenca_clinica").select("ativo").eq("id", 1).single();
    const ativo = licenca?.ativo ?? true;

    if (!ativo && !isSuspensaPage) {
      if (isPacienteRoute || (isAvaliadorRoute && !isOwner)) {
        const url = request.nextUrl.clone();
        url.pathname = "/licenca-suspensa";
        return NextResponse.redirect(url);
      }
      // Dono da licença continua navegando normalmente para poder reativar.
    }
  }

  return response;
}

export const config = {
  matcher: ["/avaliador/:path*", "/paciente/:path*"],
};
