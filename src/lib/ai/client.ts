import { sleep } from "@/lib/utils";

const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/** 获取 AI 配置 */
function getConfig() {
  return {
    apiKey: process.env.AI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "deepseek/deepseek-chat",
    apiBase: process.env.AI_API_BASE ?? "https://api.deepseek.com",
    fallbackModel: process.env.AI_FALLBACK_MODEL ?? "",
  };
}

/** 标准化模型名（移除 provider/ 前缀） */
function normalizeModel(model: string): string {
  return model.includes("/") ? (model.split("/").pop() ?? model) : model;
}

/** 调用 AI 接口（OpenAI 兼容） */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const config = getConfig();
  const model = normalizeModel(config.model);
  const baseUrl = config.apiBase.replace(/\/+$/, "");

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`AI API 错误 ${res.status}: ${errText}`);
      }

      const data: ChatResponse = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("[ai] AI 返回空内容，choices 无有效响应");
      }
      return content;
    } catch (err) {
      console.error(`[ai] 第 ${attempt}/${MAX_RETRIES} 次调用失败:`, err);
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      } else {
        throw err;
      }
    }
  }

  throw new Error("[ai] 所有重试均失败");
}

/** 解析 AI 返回的 JSON（增强容错） */
export function parseJsonResponse<T>(text: string): T {
  // 1. 尝试从 Markdown 代码块中提取 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* 继续尝试其他方式 */ }
  }

  // 2. 尝试直接解析全文
  try {
    return JSON.parse(text.trim());
  } catch { /* 继续尝试 */ }

  // 3. 尝试提取第一个 JSON 数组或对象
  const jsonObjMatch = text.match(/(\{[\s\S]*\})/);
  const jsonArrMatch = text.match(/(\[[\s\S]*\])/);
  const jsonStr = jsonArrMatch?.[1] ?? jsonObjMatch?.[1];

  if (jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch { /* 继续 */ }
  }

  // 4. 尝试修复常见 JSON 问题（尾部多余逗号等）
  const cleaned = text
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```/g, "")
    .replace(/,\s*([}\]])/g, "$1") // 去掉尾部逗号
    .trim();

  return JSON.parse(cleaned);
}
