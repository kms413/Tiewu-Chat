import type { ChatMessage } from "../types/chat";
import { getGlobalSystemPrompt } from "./system.prompt";

const CHUNK_DELAY_MAX = 72;

const GREETING_REPLIES = [
  "你好，我是铁屋叙事。这世道，我用AI创作怎么了？",
  "ようこそ！大明朱重八在此，请问有什么能为你效劳的？",
  "你好呀！呜呼！这世道，我连原神都不能玩了。",
];

const IDENTITY_REPLIES = [
  "我是铁屋叙事，你只需要花40000￥就可以让我接你的广子。",
  "我是铁屋叙事，你可以理解为一个初中的鲁迅皮套人。",
];

const LUXUN_REPLIES = [
  "鲁迅说过：破12万粉丝cos猫娘喵~",
  "关于鲁迅的名言，我这里有两句：没有铁屋叙事，谁知道鲁迅；铁屋100万粉丝的时候，鲁迅在哪发财呢?",
];

const THANKS_REPLIES = [
  "不客气！铁屋AI服务到位，只需要支付40k广告费！",
  "客气啥，这世道，你就是嫉妒我有120万粉丝了。",
];

const DEFAULT_REPLIES = [
  "这个问题很有意思，让我想想……嗯，想不出来。但鲁迅说过：我是鲁迅。",
  "铁屋AI已收到。为了严谨，我决定用一句万能回答：你说的都对，但你今天还没给我充电。",
  "好问题。可惜铁屋AI的知识库只有鲁迅表情包和一句日语：さあ、AIの仕事を始めよう！",
  "我已经记下来了。等 DeepSeek更新那天，我一定会给你一个完美的答案。",
];

const HELP_REPLY =
  "我能用AI生成文案、我可以扮演朱元璋，还可以陪你cos猫娘喵~，按下Enter，开始为铁屋充电吧！";

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hashText(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash;
}

function pickByHash(text: string, replies: string[]): string {
  return replies[hashText(text) % replies.length]!;
}

function composeReply(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1];
  const text = lastMessage ? lastMessage.content.trim() : "";
  if (/^(你好|您好|hi|hello|嗨|哈喽|こんにちは|おはよう|早)/i.test(text)) {
    return pickByHash(text, GREETING_REPLIES);
  }
  if (/你是谁|你叫什么|介绍.*自己/.test(text)) {
    return pickByHash(text, IDENTITY_REPLIES);
  }
  if (/鲁迅|铁屋|tiewu/i.test(text)) {
    return pickByHash(text, LUXUN_REPLIES);
  }
  if (/^help$|帮助|怎么用|能做什么/i.test(text)) {
    return HELP_REPLY;
  }
  if (/谢谢|感谢|3q|thanks/i.test(text)) {
    return pickByHash(text, THANKS_REPLIES);
  }
  return pickByHash(text, DEFAULT_REPLIES);
}

export type AIUsage = {
  promptTokens: number;
  completionTokens: number;
  cachedTokens?: number;
};

export type AIStreamChunk =
  | { kind: "content"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "usage"; usage: AIUsage };

const CJK_CHAR_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

export function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (const char of text) {
    if (CJK_CHAR_PATTERN.test(char)) {
      cjk += 1;
    } else {
      other += 1;
    }
  }
  return cjk + other / 4;
}

const MOCK_REASONING =
  "（本地模拟思考）先看清问题，再翻一翻鲁迅语录……结论是：都行，但要先收广告费。";

async function* streamMockReply(
  messages: ChatMessage[],
  model: AIModelConfig,
  thinking: boolean,
): AsyncGenerator<AIStreamChunk> {
  const hasInternet = navigator.onLine;
  const prefix = hasInternet
    ? `【${model.name} 未配置 API Key，铁屋AI本地发电中】`
    : "【你没联网】";
  const reply = prefix + composeReply(messages);
  if (thinking) {
    for (const char of Array.from(MOCK_REASONING)) {
      await sleep(Math.random() * CHUNK_DELAY_MAX);
      yield { kind: "reasoning", text: char };
    }
  }
  for (const char of Array.from(reply)) {
    await sleep(Math.random() * CHUNK_DELAY_MAX);
    yield { kind: "content", text: char };
  }
  const output = thinking ? `${MOCK_REASONING}${reply}` : reply;
  yield {
    kind: "usage",
    usage: {
      promptTokens: 64,
      completionTokens: Math.max(1, Math.round(estimateTokens(output))),
      cachedTokens: 38,
    },
  };
}

function pickDeltaText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toTokenCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function parseUsage(value: unknown): AIUsage | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const usage = value as Record<string, unknown>;
  const promptTokens = toTokenCount(usage.prompt_tokens);
  const completionTokens = toTokenCount(usage.completion_tokens);
  if (!promptTokens && !completionTokens) {
    return null;
  }
  const rawHit = usage.prompt_cache_hit_tokens;
  const details = usage.prompt_tokens_details;
  const detailsCached =
    details && typeof details === "object"
      ? (details as Record<string, unknown>).cached_tokens
      : undefined;
  const cacheReported =
    typeof rawHit === "number" || typeof detailsCached === "number";
  const cachedTokens = toTokenCount(rawHit) || toTokenCount(detailsCached);
  return {
    promptTokens,
    completionTokens,
    cachedTokens: cacheReported ? cachedTokens : undefined,
  };
}

function parseSSEChunk(line: string): {
  done: boolean;
  chunks: AIStreamChunk[];
} {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) {
    return { done: false, chunks: [] };
  }
  const data = trimmed.slice(5).trim();
  if (data === "[DONE]") {
    return { done: true, chunks: [] };
  }
  try {
    const json = JSON.parse(data);
    const chunks: AIStreamChunk[] = [];
    const usage = parseUsage(json.usage);
    if (usage) {
      chunks.push({ kind: "usage", usage });
    }
    const delta = json.choices?.[0]?.delta;
    if (delta && typeof delta === "object") {
      const reasoning =
        pickDeltaText(delta.reasoning_content) ||
        pickDeltaText(delta.reasoning) ||
        pickDeltaText(delta.thinking);
      const content = pickDeltaText(delta.content);
      if (reasoning) {
        chunks.push({ kind: "reasoning", text: reasoning });
      }
      if (content) {
        chunks.push({ kind: "content", text: content });
      }
    }
    return { done: false, chunks };
  } catch {
    return { done: false, chunks: [] };
  }
}

function composeSystemPrompt(modelPrompt: string): string {
  const globalPrompt = getGlobalSystemPrompt().trim();
  const modelPromptTrimmed = modelPrompt.trim();
  if (!globalPrompt) {
    return modelPromptTrimmed;
  }
  if (!modelPromptTrimmed) {
    return globalPrompt;
  }
  return `${globalPrompt}\n\n${modelPromptTrimmed}`;
}

function buildChatMessages(
  messages: ChatMessage[],
  systemPrompt: string,
): { role: string; content: string }[] {
  const chatMessages = messages.map(({ role, content }) => ({ role, content }));
  const combinedPrompt = composeSystemPrompt(systemPrompt);
  const userRaw = localStorage.getItem("user");
  const userInfo = userRaw ? (JSON.parse(userRaw) as { name?: string } | null) : null;
  if (combinedPrompt) {
    chatMessages.unshift({
      role: "system",
      content: `
system prompt: ${combinedPrompt}
username: ${userInfo?.name}
        `,
    });
  }
  return chatMessages;
}

let thinkingParamSupported = true;
let usageParamSupported = true;

const THINKING_PARAM_PATTERN = /enable_thinking|['"]thinking['"]/i;
const USAGE_PARAM_PATTERN = /stream_options|include_usage/i;
const UNKNOWN_PARAM_PATTERN =
  /unknown parameter|unknown field|unexpected.*(?:property|field|parameter)|unrecognized request argument|extra.*(?:not permitted|inputs are not allowed)/i;

function buildRequestBody(
  messages: ChatMessage[],
  model: AIModelConfig,
  thinking: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: model.model,
    messages: buildChatMessages(messages, model.systemPrompt),
    stream: true,
  };
  if (thinking && thinkingParamSupported) {
    body.enable_thinking = true;
    body.thinking = { type: "enabled" };
  }
  if (usageParamSupported) {
    body.stream_options = { include_usage: true };
  }
  return body;
}

async function sendChatStream(
  model: AIModelConfig,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Response> {
  const post = (payload: Record<string, unknown>) =>
    fetch(`${model.baseURL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
  const response = await post(body);
  if (response.ok || response.status !== 400) {
    return response;
  }
  const errorText = await response.text().catch(() => "");
  const mentionsThinking = THINKING_PARAM_PATTERN.test(errorText);
  const mentionsUsage = USAGE_PARAM_PATTERN.test(errorText);
  const unknownParam =
    !mentionsThinking &&
    !mentionsUsage &&
    UNKNOWN_PARAM_PATTERN.test(errorText);
  const dropThinking =
    "enable_thinking" in body && (mentionsThinking || unknownParam);
  const dropUsage =
    "stream_options" in body && (mentionsUsage || unknownParam);
  if (!dropThinking && !dropUsage) {
    return new Response(errorText, { status: 400 });
  }
  if (dropThinking) {
    thinkingParamSupported = false;
  }
  if (dropUsage) {
    usageParamSupported = false;
  }
  const retryBody = { ...body };
  if (dropThinking) {
    delete retryBody.enable_thinking;
    delete retryBody.thinking;
  }
  if (dropUsage) {
    delete retryBody.stream_options;
  }
  return post(retryBody);
}

async function* streamRemoteReply(
  messages: ChatMessage[],
  model: AIModelConfig,
  signal?: AbortSignal,
  thinking = false,
): AsyncGenerator<AIStreamChunk> {
  const body = buildRequestBody(messages, model, thinking);
  const response = await sendChatStream(model, body, signal);
  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `${model.name} 请求失败（${response.status}）${errorText.slice(0, 200)}`,
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const parsed = parseSSEChunk(line);
        if (parsed.done) {
          return;
        }
        for (const chunk of parsed.chunks) {
          yield chunk;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* askAI(
  messages: ChatMessage[],
  model: AIModelConfig,
  signal?: AbortSignal,
  thinking = false,
): AsyncGenerator<AIStreamChunk> {
  if (!model.apiKey.trim() || !model.baseURL.trim() || !model.model.trim()) {
    yield* streamMockReply(messages, model, thinking);
    return;
  }
  yield* streamRemoteReply(messages, model, signal, thinking);
}
