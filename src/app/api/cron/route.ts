import { NextRequest, NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/cron/runner";

export const dynamic = "force-dynamic";

/** 定时任务触发端点 */
export async function POST(request: NextRequest) {
  // 验证密钥（必须配置 CRON_SECRET）
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET 未配置，拒绝访问");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const secret = request.headers.get("x-cron-secret");
  if (secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 支持指定日期（如 ?date=2026-02-07），默认今天
    const dateParam = request.nextUrl.searchParams.get("date") ?? undefined;
    const result = await runDailyPipeline(dateParam);
    return NextResponse.json({
      success: true,
      ...result,
      date: dateParam ?? "today",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron] 任务执行失败:", err);
    // 不向客户端暴露内部错误详情
    return NextResponse.json(
      { error: "Pipeline execution failed" },
      { status: 500 }
    );
  }
}

/** 也支持 GET 方式触发（方便 Vercel Cron） */
export async function GET(request: NextRequest) {
  return POST(request);
}
