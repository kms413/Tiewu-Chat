type ChatRole = "user" | "assistant" | "system";

type ChatMessageStats = {
    speed?: number;
    tokens?: number;
    cachedRate?: number;
};

type ChatMessage = {
    id: string;
    role: ChatRole;
    content: string;
    reasoning?: string;
    stats?: ChatMessageStats;
    modelId?: string;
    modelName?: string;
};

export type {
    ChatRole,
    ChatMessage,
    ChatMessageStats,
}
