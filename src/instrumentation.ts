/**
 * Next.js Instrumentation Hook
 * 服务器启动时自动执行，用于初始化定时任务调度器
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 仅在 Node.js 运行时启动（不在 Edge 运行时）
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/cron/scheduler");
    startScheduler();
  }
}
