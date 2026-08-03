import { create } from "zustand";
import {
    listSessionMetas,
    loadSession,
    removeSession,
    saveSession,
} from "../lib/chat.history";
import type { ChatMessage } from "../types/chat";
import useAIModelsStore from "./useAIModelsStore";

type ChatStoreState = {
    sessions: ChatSessionMeta[];
    sessionsLoaded: boolean;
    activeSessionId: string | null;
    messages: ChatMessage[];
    isMessagesLoading: boolean;
    isStreaming: boolean;
    streamingMessageId: string | null;
    initSessions: () => Promise<void>;
    startNewSession: () => void;
    openSession: (id: string) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    appendUserMessage: (content: string) => void;
    appendAssistantMessage: (model: AIModelConfig) => ChatMessage;
    appendChunk: (messageId: string, chunk: string) => void;
    setStreaming: (messageId: string | null) => void;
    finishStreaming: () => Promise<void>;
    flushActiveSession: () => Promise<void>;
    persistStreamSnapshot: (
        sessionId: string,
        messages: ChatMessage[],
        model: AIModelConfig | null
    ) => Promise<void>;
};

function toMeta(session: ChatSession): ChatSessionMeta {
    return {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length,
        modelId: session.modelId,
        modelName: session.modelName,
    };
}

function deriveSessionTitle(session: ChatSession): string {
    if (session.title && session.title !== "新对话") {
        return session.title;
    }
    const firstUserMessage = session.messages.find(
        (message) => message.role === "user"
    );
    return firstUserMessage
        ? firstUserMessage.content.trim().slice(0, 24)
        : "新对话";
}

const useChatStore = create<ChatStoreState>((set, get) => {
    // 存储写入串行排队，避免并发写导致旧数据覆盖新数据
    let persistChain: Promise<void> = Promise.resolve();

    function persistSession(session: ChatSession): Promise<void> {
        const task = persistChain.then(() => saveSession(session));
        persistChain = task.catch(() => {});
        return task.then(() => {
            const meta = toMeta(session);
            set((state) => ({
                sessions: [meta, ...state.sessions.filter((item) => item.id !== meta.id)]
                    .sort((a, b) => b.updatedAt - a.updatedAt),
            }));
        });
    }

    function persistActiveSession(): Promise<void> {
        const state = get();
        if (!state.activeSessionId) {
            return Promise.resolve();
        }
        const meta = state.sessions.find((item) => item.id === state.activeSessionId);
        const model = useAIModelsStore.getState().getActiveModel();
        const session: ChatSession = {
            id: state.activeSessionId,
            title: meta?.title ?? "新对话",
            createdAt: meta?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            modelId: model?.id ?? meta?.modelId ?? "",
            modelName: model?.name ?? meta?.modelName ?? "",
            messages: state.messages,
        };
        session.title = deriveSessionTitle(session);
        return persistSession(session);
    }

    return {
        sessions: [],
        sessionsLoaded: false,
        activeSessionId: null,
        messages: [],
        isMessagesLoading: false,
        isStreaming: false,
        streamingMessageId: null,

        initSessions: async () => {
            if (get().sessionsLoaded) {
                return;
            }
            try {
                let sessions = await listSessionMetas();
                const emptyIds = sessions
                    .filter((session) => session.messageCount === 0)
                    .map((session) => session.id);
                if (emptyIds.length) {
                    await Promise.all(emptyIds.map((id) => removeSession(id)));
                    sessions = sessions.filter((session) => session.messageCount > 0);
                }
                set({ sessions, sessionsLoaded: true });
                if (!get().activeSessionId) {
                    get().startNewSession();
                }
            } catch {
                set({ sessionsLoaded: true });
                if (!get().activeSessionId) {
                    get().startNewSession();
                }
            }
        },

        startNewSession: () => {
            const model = useAIModelsStore.getState().getActiveModel();
            const now = Date.now();
            const session: ChatSession = {
                id: crypto.randomUUID(),
                title: "新对话",
                createdAt: now,
                updatedAt: now,
                modelId: model?.id ?? "",
                modelName: model?.name ?? "",
                messages: [],
            };
            set({
                activeSessionId: session.id,
                messages: [],
                isStreaming: false,
                streamingMessageId: null,
                isMessagesLoading: false,
            });
            void persistSession(session);
        },

        openSession: async (id) => {
            set({
                activeSessionId: id,
                messages: [],
                isMessagesLoading: true,
                isStreaming: false,
                streamingMessageId: null,
            });
            try {
                const session = await loadSession(id);
                if (get().activeSessionId !== id) {
                    return;
                }
                set({
                    messages: session?.messages ?? [],
                    isMessagesLoading: false,
                });
                if (session?.modelId) {
                    const modelStore = useAIModelsStore.getState();
                    if (modelStore.getModelById(session.modelId)) {
                        modelStore.setActiveModel(session.modelId);
                    }
                }
            } catch {
                if (get().activeSessionId === id) {
                    set({ isMessagesLoading: false });
                }
            }
        },

        deleteSession: async (id) => {
            try {
                await removeSession(id);
            } catch {
                // 本地列表仍继续删除
            }
            const wasActive = get().activeSessionId === id;
            set({ sessions: get().sessions.filter((session) => session.id !== id) });
            if (wasActive) {
                get().startNewSession();
            }
        },

        appendUserMessage: (content) => {
            const message: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content,
            };
            if (!get().activeSessionId) {
                get().startNewSession();
            }
            set((state) => ({ messages: [...state.messages, message] }));
            void persistActiveSession().catch(() => {});
        },

        appendAssistantMessage: (model) => {
            const message: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
                modelId: model.id,
                modelName: model.name,
            };
            set((state) => ({ messages: [...state.messages, message] }));
            return message;
        },

        appendChunk: (messageId, chunk) => {
            set((state) => ({
                messages: state.messages.map((message) =>
                    message.id === messageId
                        ? { ...message, content: message.content + chunk }
                        : message
                ),
            }));
        },

        setStreaming: (messageId) => {
            set({
                isStreaming: messageId !== null,
                streamingMessageId: messageId,
            });
        },

        finishStreaming: async () => {
            const messageId = get().streamingMessageId;
            set({ isStreaming: false, streamingMessageId: null });
            if (messageId) {
                set((state) => {
                    const target = state.messages.find(
                        (message) => message.id === messageId
                    );
                    return target && !target.content
                        ? {
                              messages: state.messages.filter(
                                  (message) => message.id !== messageId
                              ),
                          }
                        : {};
                });
            }
            await persistActiveSession();
        },

        flushActiveSession: () => persistActiveSession(),

        persistStreamSnapshot: (sessionId, messages, model) => {
            const meta = get().sessions.find((item) => item.id === sessionId);
            const session: ChatSession = {
                id: sessionId,
                title: meta?.title ?? "新对话",
                createdAt: meta?.createdAt ?? Date.now(),
                updatedAt: Date.now(),
                modelId: model?.id ?? meta?.modelId ?? "",
                modelName: model?.name ?? meta?.modelName ?? "",
                messages,
            };
            session.title = deriveSessionTitle(session);
            return persistSession(session);
        },
    };
});

export default useChatStore;
