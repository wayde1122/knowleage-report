/**
 * 内置定时任务调度器（纯原生实现，无第三方依赖）
 * 根据 CRON_SCHEDULE 环境变量配置执行时间
 * 格式: "分 时 * * *"（仅支持固定时间，不支持完整 cron 语法）
 */

import { runDailyPipeline } from "./runner";
import { getTodayDate } from "@/lib/utils";

let schedulerRunning = false;
let lastRunDate = "";

/** 解析简单的 cron 表达式，返回 { minute, hour } */
function parseCronSchedule(schedule: string): { minute: number; hour: number } {
  const parts = schedule.trim().split(/\s+/);
  return {
    minute: parseInt(parts[0] ?? "0", 10),
    hour: parseInt(parts[1] ?? "8", 10),
  };
}

/** 计算距离下次执行的毫秒数 */
function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // 如果今天的执行时间已过，设为明天
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/** 执行定时任务 */
async function executeTask(): Promise<void> {
  const today = getTodayDate();

  // 防止同一天重复执行
  if (lastRunDate === today) {
    console.log(`[scheduler] 今日 ${today} 已执行过，跳过`);
    return;
  }

  console.log(`[scheduler] 开始执行每日任务: ${today}`);
  lastRunDate = today;

  try {
    const result = await runDailyPipeline(today);
    console.log(
      `[scheduler] 任务完成: ${result.articlesCount} 篇文章, 日报${result.reportGenerated ? "已" : "未"}生成`
    );
  } catch (err) {
    console.error("[scheduler] 任务执行失败:", err);
    // 失败后重置，允许重试
    lastRunDate = "";
  }
}

/** 调度下一次执行 */
function scheduleNext(hour: number, minute: number): void {
  const delay = msUntilNext(hour, minute);
  const nextTime = new Date(Date.now() + delay);
  const timeStr = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(nextTime);

  console.log(`[scheduler] 下次执行: ${timeStr} (${Math.round(delay / 60000)} 分钟后)`);

  setTimeout(async () => {
    await executeTask();
    // 执行完后调度下一次
    scheduleNext(hour, minute);
  }, delay);
}

/** 启动定时调度器 */
export function startScheduler(): void {
  if (schedulerRunning) {
    console.log("[scheduler] 调度器已在运行中");
    return;
  }

  const schedule = process.env.CRON_SCHEDULE ?? "0 8 * * *";
  const { hour, minute } = parseCronSchedule(schedule);

  schedulerRunning = true;
  console.log(`[scheduler] 启动定时调度器，执行时间: 每天 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);

  scheduleNext(hour, minute);
}
