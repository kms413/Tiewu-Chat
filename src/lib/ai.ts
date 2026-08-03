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

async function* streamMockReply(
    messages: ChatMessage[],
    model: AIModelConfig
): AsyncGenerator<string> {
    const hasInternet = navigator.onLine;
    const prefix = hasInternet
        ? `【${model.name} 未配置 API Key，铁屋AI本地发电中】`
        : "【你没联网】";
    const reply = prefix + composeReply(messages);
    for (const char of Array.from(reply)) {
        await sleep(Math.random() * CHUNK_DELAY_MAX);
        yield char;
    }
}

function parseSSEChunk(
    line: string
): { done: boolean; content: string } {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
        return { done: false, content: "" };
    }
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") {
        return { done: true, content: "" };
    }
    try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        return {
            done: false,
            content: typeof delta === "string" ? delta : "",
        };
    } catch {
        return { done: false, content: "" };
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
    systemPrompt: string
): { role: string; content: string }[] {
    const chatMessages = messages.map(({ role, content }) => ({ role, content }));
    const combinedPrompt = composeSystemPrompt(systemPrompt);
    if (combinedPrompt) {
        chatMessages.unshift({ role: "system", content: combinedPrompt });
    }
    return chatMessages;
}

async function* streamRemoteReply(
    messages: ChatMessage[],
    model: AIModelConfig,
    signal?: AbortSignal
): AsyncGenerator<string> {
    const response = await fetch(
        `${model.baseURL.replace(/\/+$/, "")}/chat/completions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${model.apiKey}`,
            },
            body: JSON.stringify({
                model: model.model,
                messages: buildChatMessages(messages, model.systemPrompt),
                stream: true,
            }),
            signal,
        }
    );
    if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
            `${model.name} 请求失败（${response.status}）${errorText.slice(0, 200)}`
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
                const chunk = parseSSEChunk(line);
                if (chunk.done) {
                    return;
                }
                if (chunk.content) {
                    yield chunk.content;
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
    signal?: AbortSignal
): AsyncGenerator<string> {
    if (!model.apiKey.trim() || !model.baseURL.trim() || !model.model.trim()) {
        yield* streamMockReply(messages, model);
        return;
    }
    yield* streamRemoteReply(messages, model, signal);
}
