import { create } from "zustand";
import {
    createModelFromDraft,
    loadAIModels,
    resolveAIModel,
    saveAIModels,
} from "../lib/ai.models";

type AIModelsStore = {
    models: AIModelConfig[];
    activeModelId: string;
    isLoaded: boolean;
    init: () => void;
    getActiveModel: () => AIModelConfig | null;
    getModelById: (id: string) => AIModelConfig | null;
    setActiveModel: (id: string) => void;
    addModel: (draft: AIModelDraft) => AIModelConfig;
    updateModel: (id: string, patch: Partial<AIModelConfig>) => void;
    removeModel: (id: string) => void;
};

let persistTimer: number | null = null;

function schedulePersist(get: () => AIModelsStore): void {
    if (persistTimer !== null) {
        window.clearTimeout(persistTimer);
    }
    persistTimer = window.setTimeout(() => {
        persistTimer = null;
        const state = get();
        saveAIModels({
            models: state.models,
            activeModelId: state.activeModelId,
        });
    }, 200);
}

const initial = loadAIModels();

const useAIModelsStore = create<AIModelsStore>((set, get) => ({
    models: initial.models,
    activeModelId: initial.activeModelId,
    isLoaded: true,
    init: () => {},
    getActiveModel: () => resolveAIModel(get().models, get().activeModelId),
    getModelById: (id) => resolveAIModel(get().models, id),
    setActiveModel: (id) => {
        if (get().models.some((model) => model.id === id)) {
            set({ activeModelId: id });
            schedulePersist(get);
        }
    },
    addModel: (draft) => {
        const model = createModelFromDraft(draft);
        set((state) => ({
            models: [...state.models, model],
            activeModelId: model.id,
        }));
        schedulePersist(get);
        return model;
    },
    updateModel: (id, patch) => {
        if (!get().models.some((model) => model.id === id)) {
            return;
        }
        set((state) => ({
            models: state.models.map((model) =>
                model.id === id
                    ? { ...model, ...patch, id: model.id, builtin: model.builtin }
                    : model
            ),
        }));
        schedulePersist(get);
    },
    removeModel: (id) => {
        const model = get().models.find((item) => item.id === id);
        if (!model || model.builtin) {
            return;
        }
        set((state) => {
            const models = state.models.filter((item) => item.id !== id);
            return {
                models,
                activeModelId:
                    state.activeModelId === id
                        ? (models[0]?.id ?? "")
                        : state.activeModelId,
            };
        });
        schedulePersist(get);
    },
}));

export default useAIModelsStore;
