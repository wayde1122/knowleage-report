import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTodayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 转义 PostgREST 过滤器中的特殊字符 */
function escapeFilterValue(value: string): string {
  // 移除 PostgREST 语法字符，防止过滤器注入
  return value.replace(/[,().\\]/g, "");
}

/** 文章列表 API */
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;

  const date = searchParams.get("date") ?? getTodayDate();
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50), 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("articles")
    .select("*", { count: "exact" })
    .eq("fetched_date", date)
    .order("heat_value", { ascending: false, nullsFirst: false })
    .order("rank", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    const safeSearch = escapeFilterValue(search);
    if (safeSearch.length > 0) {
      query = query.or(`title.ilike.%${safeSearch}%,title_zh.ilike.%${safeSearch}%,summary.ilike.%${safeSearch}%`);
    }
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 查询该日期各分类的实际文章数（独立于分页和筛选）
  let categoryCounts: Record<string, number> = {};
  const { data: allForDate } = await supabaseAdmin
    .from("articles")
    .select("category")
    .eq("fetched_date", date);

  if (allForDate) {
    for (const row of allForDate) {
      categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
    }
  }

  return NextResponse.json({
    articles: data ?? [],
    total: count ?? 0,
    categoryCounts,
    page,
    limit,
    date,
  });
}
