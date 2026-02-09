import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/** 客户端用 Supabase（前端用） */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) {
      throw new Error("Supabase 环境变量未配置：NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** 服务端用 Supabase（定时任务、API Route 用） */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!url || !key) {
      throw new Error("Supabase 环境变量未配置：NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

/** 向后兼容的别名 */
export const supabaseAdmin = {
  from: (...args: Parameters<SupabaseClient["from"]>) => getSupabaseAdmin().from(...args),
};
