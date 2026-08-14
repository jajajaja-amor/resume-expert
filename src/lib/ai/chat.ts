import type { AIConfig } from "@/lib/ai/config";
import { getAIConfig } from "@/lib/ai/config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; config?: AIConfig }
): Promise<string> {
  const config = options?.config ?? getAIConfig();
  if (!config.apiKey) {
    throw new Error("未配置 LLM_API_KEY，无法调用大模型。");
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 2500,
      messages,
    }),
  });

  const json = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(json.error?.message || `LLM 调用失败（HTTP ${response.status}）`);
  }

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM 返回为空");
  return content;
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      try {
        return JSON.parse(fence[1]);
      } catch {
        // continue
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("无法解析模型返回的 JSON");
  }
}
