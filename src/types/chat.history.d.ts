type ChatSessionMeta = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
    modelId: string;
    modelName: string;
};

type ChatSession = {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    modelId: string;
    modelName: string;
    messages: ChatMessage[];
};
