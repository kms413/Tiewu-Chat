type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
    id: string;
    role: ChatRole;
    content: string;
    modelId?: string;
    modelName?: string;
};

export type {
    ChatRole,
    ChatMessage,
}
