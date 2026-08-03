type AIModelConfig = {
    id: string;
    name: string;
    baseURL: string;
    model: string;
    apiKey: string;
    description: string;
    systemPrompt: string;
    builtin: boolean;
};

type AIModelsState = {
    models: AIModelConfig[];
    activeModelId: string;
};

type AIModelDraft = {
    name: string;
    baseURL: string;
    model: string;
    apiKey: string;
    description: string;
    systemPrompt: string;
};
