import { createBrowserClient } from "@supabase/ssr";

// A chave "anon" é pública por natureza (é isso que ela foi feita para
// ser - a segurança real vem das políticas RLS no banco). Os valores de
// ambiente têm prioridade quando configurados na Vercel; estes são o
// fallback para o projeto Supabase desta clínica.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://stjizeqqokjyssrerwyd.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aml6ZXFxb2tqeXNzcmVyd3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTE1MDgsImV4cCI6MjEwNTA2NzUwOH0.XQBc8bbNY9Kmz8x4s4gMQNbu0CV0l3lx7YeeVcPA6VU";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
