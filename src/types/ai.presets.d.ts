type AIPresetId =
    | "deepseek-v4-flash"
    | "deepseek-v4-pro"
    | "kimi-k2"
    | "kimi-k2-thinking"
    | "custom";

type AIPreset = {
    id: AIPresetId;
    name: string;
    baseURL: string;
    model: string;
    description: string;
};

type AISettings = {
    presetId: AIPresetId;
    apiKey: string;
    customBaseURL: string;
    customModel: string;
};
