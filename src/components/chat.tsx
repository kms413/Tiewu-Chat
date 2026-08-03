import React, { Suspense, useEffect } from "react";
import ReactDom from "react-dom";
import style from "../css/chat.module.less";
import { askAI } from "../lib/ai";
import type { ChatMessage } from "../types/chat";
import useAIModelsStore from "../stores/useAIModelsStore";
import useChatStore from "../stores/useChatStore";

const LuxunSayings = [
    "没有铁屋叙事，谁知道鲁迅🤣🤣🤣",
    "铁屋100万粉丝的时候，鲁迅在哪发财呢🤣🤣🤣",
];
const Settings = React.lazy(() => import("../containers/settings"));

const RANDOM_LUXUN_SAYING =
    LuxunSayings[Math.floor(Math.random() * LuxunSayings.length)];

function LuxunAvatar({ className }: { className?: string }) {
    const imageRef = React.useRef<HTMLImageElement>(null);
    React.useLayoutEffect(() => {
        import("../assets/tiewu.png").then((module) => {
            if (imageRef.current) {
                imageRef.current.src = module.default;
            }
        });
    }, []);
    return (
        <img
            ref={imageRef}
            alt="铁屋"
            draggable={false}
            className={className ?? ""}
        />
    );
}

function WelcomeScreenTitle() {
    return (
        <div>
            <h1 className={style["welcome-screen-title"]}>
                <LuxunAvatar className={style["welcome-screen-luxun-image"]} />
                <i>鲁迅名言：</i>
                {RANDOM_LUXUN_SAYING}
            </h1>
        </div>
    );
}

function WelcomeScreen() {
    return (
        <div className={style["welcome-screen"]}>
            <WelcomeScreenTitle />
        </div>
    );
}

const MessageComponent = React.memo(function MessageComponent({
    message,
    isStreaming,
}: {
    message: ChatMessage;
    isStreaming: boolean;
}) {
    const isUser = message.role === "user";
    return (
        <div
            className={`${style["message-row"]} ${
                isUser
                    ? style["message-row-user"]
                    : style["message-row-assistant"]
            }`}
        >
            {!isUser && <LuxunAvatar className={style["message-avatar"]} />}
            <div
                className={`${style["message-bubble"]} ${
                    isUser
                        ? style["message-bubble-user"]
                        : style["message-bubble-assistant"]
                }`}
            >
                {!isUser && message.modelName && (
                    <div className={style["message-model-label"]}>
                        {message.modelName}
                    </div>
                )}
                {message.content}
                {isStreaming && (
                    <span className={style["message-streaming-cursor"]}></span>
                )}
            </div>
        </div>
    );
});

function MessageList({
    messages,
    streamingMessageId,
    isMessagesLoading,
}: {
    messages: ChatMessage[];
    streamingMessageId: string | null;
    isMessagesLoading: boolean;
}) {
    const listRef = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, isMessagesLoading]);
    return (
        <div ref={listRef} className={style["message-list"]}>
            {isMessagesLoading && (
                <div className={style["message-loading"]}>加载中…</div>
            )}
            {messages.map((message) => (
                <MessageComponent
                    key={message.id}
                    message={message}
                    isStreaming={message.id === streamingMessageId}
                />
            ))}
        </div>
    );
}

type InputBoxProps = {
    value: string;
    isStreaming: boolean;
    isSendDisabled: boolean;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSend: () => void;
    onStop: () => void;
};

function ModelSelector({ disabled }: { disabled: boolean }) {
    const models = useAIModelsStore((state) => state.models);
    const activeModelId = useAIModelsStore((state) => state.activeModelId);
    const setActiveModel = useAIModelsStore((state) => state.setActiveModel);
    const [isOpen, setIsOpen] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const activeModel =
        models.find((model) => model.id === activeModelId) ?? models[0] ?? null;

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleOnPointerDown = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleOnKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOnPointerDown);
        document.addEventListener("keydown", handleOnKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOnPointerDown);
            document.removeEventListener("keydown", handleOnKeyDown);
        };
    }, [isOpen]);

    const handleSelectModel = (id: string) => {
        setActiveModel(id);
        setIsOpen(false);
    };

    return (
        <div ref={rootRef} className={style["model-selector"]}>
            <button
                className={style["model-selector-current"]}
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((value) => !value)}
            >
                <span className={style["model-selector-label"]}>AI</span>
                <span className={style["model-selector-name"]}>
                    {activeModel?.name ?? "未配置模型"}
                </span>
                <span className={style["model-selector-arrow"]}>
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>
            {isOpen && (
                <div className={style["model-selector-popup"]}>
                    {models.map((model) => (
                        <button
                            key={model.id}
                            type="button"
                            className={`${style["model-selector-item"]} ${
                                model.id === activeModelId
                                    ? style["model-selector-item-active"]
                                    : ""
                            }`}
                            onClick={() => handleSelectModel(model.id)}
                        >
                            <span className={style["model-selector-item-name"]}>
                                {model.name}
                            </span>
                            <span className={style["model-selector-item-desc"]}>
                                {model.model}
                                {model.description
                                    ? ` · ${model.description}`
                                    : ""}
                            </span>
                        </button>
                    ))}
                    {models.length === 0 && (
                        <div className={style["model-selector-empty"]}>
                            暂无模型，请到设置中新建
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function InputComponent({
    value,
    isStreaming,
    isSendDisabled,
    onChange,
    onSend,
    onStop,
}: InputBoxProps) {
    const handleOnKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter" || e.shiftKey) {
            return;
        }
        e.preventDefault();
        onSend();
    };
    return (
        <div className={style["input-component"]}>
            <div className={style["input-component-border"]}></div>
            <div className={style["input-component-background"]}></div>
            <textarea
                className={style["input-component-textarea"]}
                placeholder="さあ、AIの仕事を始めよう！"
                value={value}
                onChange={onChange}
                onKeyDown={handleOnKeyDown}
            />
            {isStreaming ? (
                <button
                    className={style["input-component-button"]}
                    onClick={onStop}
                >
                    Stop
                </button>
            ) : (
                <button
                    className={style["input-component-button"]}
                    onClick={onSend}
                    disabled={isSendDisabled}
                >
                    Send
                </button>
            )}
        </div>
    );
}

function InputBox(props: InputBoxProps) {
    return (
        <div className={style["input-box"]}>
            <ModelSelector disabled={props.isStreaming} />
            <InputComponent {...props} />
        </div>
    );
}

function LeftButtonArea({ onNewChat }: { onNewChat: () => void }) {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    function handleSettingsToggle() {
        setIsSettingsOpen(!isSettingsOpen);
    }
    function handleSettingsClose() {
        setIsSettingsOpen(false);
    }

    return (
        <>
            <div className={style["left-button-area"]}>
                <button
                    className={style["left-button"]}
                    onClick={onNewChat}
                >
                    新对话
                </button>
                <button
                    className={style["left-button"]}
                    onClick={handleSettingsToggle}
                >
                    设置
                </button>
            </div>
            {isSettingsOpen &&
                ReactDom.createPortal(
                    <Suspense fallback={<></>}>
                        <Settings onClose={handleSettingsClose} />
                    </Suspense>,
                    document.body
                )}
        </>
    );
}

export function Container({ children }: { children: React.ReactNode }) {
    return <div className={style.container}>{children}</div>;
}

function formatSessionTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    if (date.toDateString() === now.toDateString()) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    if (date.getFullYear() === now.getFullYear()) {
        return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function LeftArea({ onNewChat }: { onNewChat: () => void }) {
    const sessions = useChatStore((state) => state.sessions);
    const sessionsLoaded = useChatStore((state) => state.sessionsLoaded);
    const activeSessionId = useChatStore((state) => state.activeSessionId);
    const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
        null
    );

    useEffect(() => {
        void useChatStore.getState().initSessions();
    }, []);

    const visibleSessions = sessions.filter(
        (session) => session.messageCount > 0
    );

    return (
        <div className={style["left-area"]}>
            <div className={style["left-title"]}>Tiewu Chat</div>
            <div className={style["history-area"]}>
                <div className={style["history-title"]}>对话历史</div>
                {!sessionsLoaded && (
                    <div className={style["history-loading"]}>加载中…</div>
                )}
                {sessionsLoaded && visibleSessions.length === 0 && (
                    <div className={style["history-empty"]}>暂无历史记录</div>
                )}
                {visibleSessions.map((session) => (
                    <div
                        key={session.id}
                        className={`${style["history-item"]} ${
                            session.id === activeSessionId
                                ? style["history-item-active"]
                                : ""
                        }`}
                    >
                        <button
                            type="button"
                            className={style["history-item-main"]}
                            onClick={() => {
                                setConfirmDeleteId(null);
                                void useChatStore.getState().openSession(session.id);
                            }}
                        >
                            <span className={style["history-item-title"]}>
                                {session.title}
                            </span>
                            <span className={style["history-item-meta"]}>
                                {formatSessionTime(session.updatedAt)} ·{" "}
                                {session.modelName}
                            </span>
                        </button>
                        <button
                            type="button"
                            className={style["history-item-delete"]}
                            onBlur={() => setConfirmDeleteId(null)}
                            onClick={() => {
                                if (confirmDeleteId === session.id) {
                                    setConfirmDeleteId(null);
                                    void useChatStore
                                        .getState()
                                        .deleteSession(session.id);
                                } else {
                                    setConfirmDeleteId(session.id);
                                }
                            }}
                        >
                            {confirmDeleteId === session.id ? "确认?" : "×"}
                        </button>
                    </div>
                ))}
            </div>
            <LeftButtonArea onNewChat={onNewChat} />
        </div>
    );
}

export function RightArea() {
    const messages = useChatStore((state) => state.messages);
    const isStreaming = useChatStore((state) => state.isStreaming);
    const streamingMessageId = useChatStore((state) => state.streamingMessageId);
    const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
    const [inputValue, setInputValue] = React.useState("");
    const stopStreamingRef = React.useRef(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const sessionSnapshotsRef = React.useRef<Map<string, ChatMessage[]>>(new Map());

    useEffect(() => {
        return () => {
            stopStreamingRef.current = true;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            void useChatStore.getState().flushActiveSession();
        };
    }, []);

    const handleOnInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    };

    const handleOnStop = () => {
        stopStreamingRef.current = true;
        abortControllerRef.current?.abort();
    };

    const handleOnSend = async () => {
        const content = inputValue.trim();
        if (!content || isStreaming) {
            return;
        }
        const model = useAIModelsStore.getState().getActiveModel();
        if (!model) {
            return;
        }
        const chatStore = useChatStore.getState();
        if (!chatStore.activeSessionId) {
            chatStore.startNewSession();
        }
        const sessionIdAtStart = useChatStore.getState().activeSessionId;
        if (!sessionIdAtStart) {
            return;
        }
        chatStore.appendUserMessage(content);
        const history = [...useChatStore.getState().messages];
        const assistantMessage = chatStore.appendAssistantMessage(model);
        setInputValue("");
        useChatStore.getState().setStreaming(assistantMessage.id);
        stopStreamingRef.current = false;
        abortControllerRef.current = new AbortController();
        let lastPersistAt = Date.now();
        try {
            for await (const chunk of askAI(
                history,
                model,
                abortControllerRef.current.signal
            )) {
                if (stopStreamingRef.current) {
                    break;
                }
                useChatStore.getState().appendChunk(assistantMessage.id, chunk);
                sessionSnapshotsRef.current.set(
                    sessionIdAtStart,
                    useChatStore.getState().messages
                );
                if (Date.now() - lastPersistAt > 1000) {
                    lastPersistAt = Date.now();
                    void useChatStore.getState().flushActiveSession();
                }
            }
        } catch (error) {
            if (!abortControllerRef.current?.signal.aborted) {
                const errorText =
                    error instanceof Error ? error.message : String(error);
                useChatStore
                    .getState()
                    .appendChunk(assistantMessage.id, `【请求失败】${errorText}`);
            }
        } finally {
            const currentStore = useChatStore.getState();
            if (currentStore.activeSessionId !== sessionIdAtStart) {
                const snapshot = sessionSnapshotsRef.current.get(sessionIdAtStart);
                if (snapshot) {
                    void currentStore.persistStreamSnapshot(
                        sessionIdAtStart,
                        snapshot,
                        model
                    );
                    sessionSnapshotsRef.current.delete(sessionIdAtStart);
                }
            } else {
                sessionSnapshotsRef.current.delete(sessionIdAtStart);
            }
            await currentStore.finishStreaming();
            stopStreamingRef.current = false;
            abortControllerRef.current = null;
        }
    };

    const showWelcome = messages.length === 0 && !isMessagesLoading;

    return (
        <div className={style["right-area"]}>
            {showWelcome && <WelcomeScreen />}
            {!showWelcome && (
                <MessageList
                    messages={messages}
                    streamingMessageId={streamingMessageId}
                    isMessagesLoading={isMessagesLoading}
                />
            )}
            <InputBox
                value={inputValue}
                isStreaming={isStreaming}
                isSendDisabled={!inputValue.trim()}
                onChange={handleOnInputChange}
                onSend={handleOnSend}
                onStop={handleOnStop}
            />
        </div>
    );
}
