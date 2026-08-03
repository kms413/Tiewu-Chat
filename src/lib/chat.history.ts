import localforage from "localforage";

const HISTORY_INSTANCE = "chat-history";
const SESSIONS_INDEX_KEY = "chat-sessions-index";
const SESSION_PREFIX = "chat-session:";

const historyStore = localforage.createInstance({
    name: HISTORY_INSTANCE,
});

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

function upsertMeta(
    metas: ChatSessionMeta[],
    meta: ChatSessionMeta
): ChatSessionMeta[] {
    return [meta, ...metas.filter((item) => item.id !== meta.id)].sort(
        (a, b) => b.updatedAt - a.updatedAt
    );
}

async function listSessionMetas(): Promise<ChatSessionMeta[]> {
    const metas = await historyStore.getItem<ChatSessionMeta[]>(SESSIONS_INDEX_KEY);
    return Array.isArray(metas) ? metas : [];
}

async function loadSession(id: string): Promise<ChatSession | null> {
    const session = await historyStore.getItem<ChatSession>(SESSION_PREFIX + id);
    return session ?? null;
}

// 索引更新串行排队，避免并发写覆盖
let indexQueue: Promise<void> = Promise.resolve();

function queueIndexUpdate(
    updater: (metas: ChatSessionMeta[]) => ChatSessionMeta[]
): Promise<void> {
    const task = indexQueue.then(async () => {
        const metas = await listSessionMetas();
        await historyStore.setItem(SESSIONS_INDEX_KEY, updater(metas));
    });
    indexQueue = task.catch(() => {});
    return task;
}

async function saveSession(session: ChatSession): Promise<void> {
    await historyStore.setItem(SESSION_PREFIX + session.id, session);
    await queueIndexUpdate((metas) => upsertMeta(metas, toMeta(session)));
}

async function removeSession(id: string): Promise<void> {
    await historyStore.removeItem(SESSION_PREFIX + id);
    await queueIndexUpdate((metas) => metas.filter((item) => item.id !== id));
}

export { listSessionMetas, loadSession, removeSession, saveSession };
