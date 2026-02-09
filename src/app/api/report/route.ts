import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTodayDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 日报分析 API */
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const date = request.nextUrl.searchParams.get("date") ?? getTodayDate();

  const { data, error } = await supabaseAdmin
    .from("daily_reports")
    .select("*")
    .eq("report_date", date)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 未找到记录
      return NextResponse.json({ report: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
