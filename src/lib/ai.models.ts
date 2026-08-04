const AI_MODELS_STORAGE_KEY = "ai-models";
const LEGACY_AI_SETTINGS_KEY = "ai-settings";

const DEFAULT_SYSTEM_PROMPT = "你是铁屋AI，一个熟悉鲁迅梗、爱玩原神、偶尔扮演朱元璋的赛博助手。请用轻松、幽默、略带中二的方式回答用户。";

const BUILTIN_AI_MODELS: AIModelConfig[] = [
    {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        baseURL: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
        apiKey: "",
        description: "兼顾轻量与强大的模型。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        baseURL: "https://api.deepseek.com",
        model: "deepseek-v4-pro",
        apiKey: "",
        description: "DeepSeek的最强模型，但正式版还没来。推荐用Flash。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "kimi-k2.6",
        name: "Kimi K2.6",
        baseURL: "https://api.moonshot.cn/v1",
        model: "kimi-k2.6",
        apiKey: "",
        description: "Kimi 的前几代模型，聊天还行。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "kimi-k2.7-code",
        name: "Kimi K2.7 Code",
        baseURL: "https://api.moonshot.cn/v1",
        model: "kimi-k2.7-code",
        apiKey: "",
        description: "Kimi 的上一代旗舰模型。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "kimi-k3",
        name: "Kimi K3",
        baseURL: "https://api.moonshot.cn/v1",
        model: "kimi-k3",
        apiKey: "",
        description: "Kimi 的最强旗舰模型，比肩国外顶级模型。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "mimo-v2.5",
        name: "MiMo V2.5",
        baseURL: "https://api.xiaomimimo.com/v1",
        model: "mimo-v2.5",
        apiKey: "",
        description: "小米的 Mimo 模型，性价比很高。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "mimo-v2.5-pro",
        name: "MiMo V2.5 Pro",
        baseURL: "https://api.xiaomimimo.com/v1",
        model: "mimo-v2.5-pro",
        apiKey: "",
        description: "小米的旗舰模型，现在逐渐落后。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "qwen-3.7-plus",
        name: "Qwen 3.7 Plus",
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model: "qwen3.7-plus",
        apiKey: "",
        description: "千问的 上一代次旗舰模型。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "glm-5.1",
        name: "GLM 5.1",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        model: "glm-5.1",
        apiKey: "",
        description: "智谱上一代模型。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },
    {
        id: "glm-5.2",
        name: "GLM 5.2",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        model: "glm-5.2",
        apiKey: "",
        description: "智谱的最新模型，贵的要死。",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        builtin: true,
    },

];

function createModelId(): string {
    return `model-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeModel(value: unknown): AIModelConfig | null {
    if (!isRecord(value)) {
        return null;
    }
    const { id, name, baseURL, model, apiKey, description, systemPrompt, builtin } = value;
    if (
        typeof id !== "string" ||
        typeof name !== "string" ||
        typeof baseURL !== "string" ||
        typeof model !== "string" ||
        typeof apiKey !== "string"
    ) {
        return null;
    }
    return {
        id,
        name,
        baseURL,
        model,
        apiKey,
        description: typeof description === "string" ? description : "",
        systemPrompt: typeof systemPrompt === "string" ? systemPrompt : "",
        builtin: builtin === true,
    };
}

function defaultModelsState(): AIModelsState {
    return {
        models: BUILTIN_AI_MODELS.map((model) => ({ ...model })),
        activeModelId: BUILTIN_AI_MODELS[0]!.id,
    };
}

function migrateLegacySettings(): AIModelsState | null {
    try {
        const stored = localStorage.getItem(LEGACY_AI_SETTINGS_KEY);
        if (!stored) {
            return null;
        }
        const legacy = JSON.parse(stored) as Partial<AISettings>;
        const models = BUILTIN_AI_MODELS.map((model) => ({ ...model }));
        let activeModelId = BUILTIN_AI_MODELS[0]!.id;
        const preset = models.find((model) => model.id === legacy.presetId);
        if (preset) {
            preset.apiKey = typeof legacy.apiKey === "string" ? legacy.apiKey : "";
            activeModelId = preset.id;
        }
        const hasCustomConfig =
            legacy.presetId === "custom" &&
            Boolean(legacy.customBaseURL || legacy.customModel || legacy.apiKey);
        if (hasCustomConfig) {
            const customModel: AIModelConfig = {
                id: createModelId(),
                name: "自定义 API",
                baseURL: typeof legacy.customBaseURL === "string" ? legacy.customBaseURL : "",
                model: typeof legacy.customModel === "string" ? legacy.customModel : "",
                apiKey: typeof legacy.apiKey === "string" ? legacy.apiKey : "",
                description: "从旧版设置迁移",
                systemPrompt: "",
                builtin: false,
            };
            models.push(customModel);
            activeModelId = customModel.id;
        }
        return { models, activeModelId };
    } catch {
        return null;
    }
}

function loadAIModels(): AIModelsState {
    try {
        const stored = localStorage.getItem(AI_MODELS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as {
                models?: unknown;
                activeModelId?: unknown;
            };
            const models = Array.isArray(parsed.models)
                ? parsed.models
                      .map(normalizeModel)
                      .filter((model): model is AIModelConfig => model !== null)
                : [];
            if (models.length) {
                const activeModelId =
                    typeof parsed.activeModelId === "string" &&
                    models.some((model) => model.id === parsed.activeModelId)
                        ? parsed.activeModelId
                        : models[0]!.id;
                return { models, activeModelId };
            }
        }
        const migrated = migrateLegacySettings();
        if (migrated) {
            localStorage.setItem(AI_MODELS_STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
        }
    } catch {
        // 数据损坏时回退到默认模型
    }
    return defaultModelsState();
}

function saveAIModels(state: AIModelsState): void {
    localStorage.setItem(AI_MODELS_STORAGE_KEY, JSON.stringify(state));
}

function resolveAIModel(models: AIModelConfig[], modelId: string): AIModelConfig | null {
    return models.find((model) => model.id === modelId) ?? null;
}

function createModelFromDraft(draft: AIModelDraft): AIModelConfig {
    return {
        id: createModelId(),
        name: draft.name.trim(),
        baseURL: draft.baseURL.trim(),
        model: draft.model.trim(),
        apiKey: draft.apiKey.trim(),
        description: draft.description.trim(),
        systemPrompt: draft.systemPrompt.trim(),
        builtin: false,
    };
}

export {
    AI_MODELS_STORAGE_KEY,
    BUILTIN_AI_MODELS,
    createModelFromDraft,
    loadAIModels,
    resolveAIModel,
    saveAIModels,
};
