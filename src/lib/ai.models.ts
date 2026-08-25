import {
    BUILTIN_AI_MODELS,
    AI_MODELS_STORAGE_KEY,
    LEGACY_AI_SETTINGS_KEY
} from "../assets/builtin.models"






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
