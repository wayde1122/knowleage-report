import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** 获取所有已生成日报的日期列表 */
export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("daily_reports")
    .select("report_date")
    .order("report_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dates: string[] = (data ?? []).map((d) => d.report_date);
  return NextResponse.json({ dates });
}
