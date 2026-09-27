import React, { Suspense, useEffect } from "react";
import ReactDom from "react-dom";
import style from "../css/chat.module.less";
import { askAI, estimateTokens } from "../lib/ai";
import type { AIUsage } from "../lib/ai";
import type { ChatMessage, ChatMessageStats } from "../types/chat";
import useAIModelsStore from "../stores/useAIModelsStore";
import useChatStore from "../stores/useChatStore";
import gsap from "gsap";
import MarkdownView from "./markdown";

const THINKING_STORAGE_KEY = "thinking-mode";

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
            <h1
                className={style["welcome-screen-title"]}
            >铁屋Chat：铁屋叙事同款AI工作台</h1>
            <span className={style["welcome-screen-luxun-saying"]}>
                <LuxunAvatar className={style["welcome-screen-luxun-image"]} />
                <i>鲁迅名言：</i>
                {RANDOM_LUXUN_SAYING}
            </span>
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

function ThinkingBlock({
    text,
    isStreaming,
}: {
    text: string;
    isStreaming: boolean;
}) {
    const [userOpen, setUserOpen] = React.useState<boolean | null>(null);
    const isOpen = userOpen ?? isStreaming;
    if (!text) {
        return null;
    }
    return (
        <div className={style["thinking-block"]}>
            <button
                type="button"
                className={style["thinking-block-header"]}
                onClick={() => setUserOpen(!isOpen)}
            >
                <span className={style["thinking-block-title"]}>
                    {isStreaming ? "思考中…" : "深度思考"}
                </span>
                <span className={style["thinking-block-arrow"]}>
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>
            {isOpen && (
                <div className={style["thinking-block-body"]}>
                    <MarkdownView content={text} />
                </div>
            )}
        </div>
    );
}

function formatMessageStats(stats: ChatMessageStats | undefined): string {
    if (!stats) {
        return "";
    }
    const parts: string[] = [];
    if (stats.speed !== undefined) {
        parts.push(`输出 ${stats.speed.toFixed(1)} tok/s`);
    }
    if (stats.tokens !== undefined) {
        parts.push(`${stats.tokens} tokens`);
    }
    if (stats.cachedRate !== undefined) {
        parts.push(`缓存命中 ${(stats.cachedRate * 100).toFixed(0)}%`);
    }
    return parts.join(" · ");
}

const MessageComponent = React.memo(function MessageComponent({
    message,
    isStreaming,
}: {
    message: ChatMessage;
    isStreaming: boolean;
}) {
    const isUser = message.role === "user";
    const statsText = isUser ? "" : formatMessageStats(message.stats);
    const rowRef = React.useRef<HTMLDivElement>(null);
    React.useLayoutEffect(() => {
        if (!rowRef.current) return;
        const fromX = isUser ? 30 : -30;
        gsap.fromTo(
            rowRef.current,
            { opacity: 0, x: fromX, scale: 0.96 },
            { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: "back.out(1.2)" }
        );
    }, [isUser]);
    return (
        <div
            ref={rowRef}
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
                {/* {!isUser && message.modelName && (
                    <div className={style["message-model-label"]}>
                        {message.modelName}
                    </div>
                )} */}
                {!isUser && message.reasoning && (
                    <ThinkingBlock
                        text={message.reasoning}
                        isStreaming={isStreaming}
                    />
                )}
                <MarkdownView
                    content={message.content}
                    streaming={isStreaming}
                />
                {statsText && (
                    <div className={style["message-stats"]}>{statsText}</div>
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
    const [isRendered, setIsRendered] = React.useState(false);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const popupRef = React.useRef<HTMLDivElement>(null);
    const activeModel =
        models.find((model) => model.id === activeModelId) ?? models[0] ?? null;

    const openPopup = React.useCallback(() => {
        setIsRendered(true);
        setIsOpen(true);
    }, []);

    const closePopup = React.useCallback(() => {
        setIsOpen(false);
    }, []);

    React.useLayoutEffect(() => {
        if (!popupRef.current) return;
        if (isRendered && isOpen) {
            gsap.fromTo(
                popupRef.current,
                { scaleY: 0 },
                { scaleY: 1, duration: 0.334, ease: "back.out" }
            );
        } else if (isRendered && !isOpen) {
            gsap.to(popupRef.current, {
                scaleY: 0,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => setIsRendered(false),
            });
        }
    }, [isOpen, isRendered]);

    React.useEffect(() => {
        if (!isOpen) return;
        const handleOnPointerDown = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                closePopup();
            }
        };
        const handleOnKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePopup();
            }
        };
        document.addEventListener("mousedown", handleOnPointerDown);
        document.addEventListener("keydown", handleOnKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOnPointerDown);
            document.removeEventListener("keydown", handleOnKeyDown);
        };
    }, [isOpen, closePopup]);

    const toggleOpen = () => {
        if (isOpen) {
            closePopup();
        } else {
            openPopup();
        }
    };

    const handleSelectModel = (id: string) => {
        setActiveModel(id);
        closePopup();
    };

    return (
        <div ref={rootRef} className={style["model-selector"]}>
            {isRendered && (
                <div
                    ref={popupRef}
                    className={style["model-selector-popup"]}>
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
            <button
                className={style["model-selector-current"]}
                type="button"
                disabled={disabled}
                onClick={toggleOpen}
            >
                <span className={style["model-selector-label"]}>AI</span>
                <span className={style["model-selector-name"]}>
                    {activeModel?.name ?? "未配置模型"}
                </span>
                <span className={style["model-selector-arrow"]}>
                    {isOpen ? "▲" : "▼"}
                </span>
            </button>
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
    const deleteButtonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

    useEffect(() => {
        void useChatStore.getState().initSessions();
    }, []);

    useEffect(() => {
        if (!confirmDeleteId) return;
        const handlePointerDown = (event: MouseEvent) => {
            const button = deleteButtonRefs.current.get(confirmDeleteId);
            if (button && button.contains(event.target as Node)) {
                return;
            }
            setConfirmDeleteId(null);
        };
        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [confirmDeleteId]);

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
                            onClick={(event) => {
                                event.stopPropagation();
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
                            ref={(node) => {
                                if (node) {
                                    deleteButtonRefs.current.set(session.id, node);
                                } else {
                                    deleteButtonRefs.current.delete(session.id);
                                }
                            }}
                            type="button"
                            className={style["history-item-delete"]}
                            onClick={(event) => {
                                event.stopPropagation();
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
    const [thinkingEnabled, setThinkingEnabled] = React.useState(
        () => localStorage.getItem(THINKING_STORAGE_KEY) === "1"
    );
    const stopStreamingRef = React.useRef(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const sessionSnapshotsRef = React.useRef<Map<string, ChatMessage[]>>(new Map());

    useEffect(() => {
        localStorage.setItem(
            THINKING_STORAGE_KEY,
            thinkingEnabled ? "1" : "0"
        );
    }, [thinkingEnabled]);

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
        const startedAt = Date.now();
        let firstTokenAt: number | null = null;
        let lastTokenAt = 0;
        let outputTokens = 0;
        let usage: AIUsage | null = null;
        let lastStatsAt = 0;

        const emitStats = (isFinal: boolean) => {
            const now = Date.now();
            if (outputTokens <= 0 && !usage) {
                return;
            }
            if (!isFinal && now - lastStatsAt < 500) {
                return;
            }
            lastStatsAt = now;
            const base = firstTokenAt ?? startedAt;
            const endAt = isFinal ? Math.max(lastTokenAt, base) : now;
            const seconds = Math.max((endAt - base) / 1000, 0.1);
            let speed =
                outputTokens > 0 ? outputTokens / seconds : undefined;
            if (
                usage &&
                firstTokenAt !== null &&
                lastTokenAt > firstTokenAt
            ) {
                speed =
                    usage.completionTokens /
                    Math.max((lastTokenAt - firstTokenAt) / 1000, 0.1);
            }
            const stats: ChatMessageStats = {
                speed,
                tokens: usage
                    ? usage.completionTokens
                    : Math.round(outputTokens),
                cachedRate:
                    usage &&
                    usage.promptTokens > 0 &&
                    usage.cachedTokens !== undefined
                        ? usage.cachedTokens / usage.promptTokens
                        : undefined,
            };
            useChatStore.getState().setMessageStats(assistantMessage.id, stats);
        };

        try {
            for await (const chunk of askAI(
                history,
                model,
                abortControllerRef.current.signal,
                thinkingEnabled
            )) {
                if (stopStreamingRef.current) {
                    break;
                }
                if (chunk.kind === "usage") {
                    usage = chunk.usage;
                    continue;
                }
                const arrivedAt = Date.now();
                if (firstTokenAt === null) {
                    firstTokenAt = arrivedAt;
                }
                lastTokenAt = arrivedAt;
                outputTokens += estimateTokens(chunk.text);
                const chatStoreNow = useChatStore.getState();
                if (chunk.kind === "reasoning") {
                    chatStoreNow.appendReasoningChunk(
                        assistantMessage.id,
                        chunk.text
                    );
                } else {
                    chatStoreNow.appendChunk(assistantMessage.id, chunk.text);
                }
                emitStats(false);
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
            emitStats(true);
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
            <div className={style["input-area"]}>
                <div className={style["input-toolbar"]}>
                    <ModelSelector disabled={isStreaming} />
                    <button
                        type="button"
                        className={`${style["thinking-toggle"]} ${
                            thinkingEnabled
                                ? style["thinking-toggle-active"]
                                : ""
                        }`}
                        disabled={isStreaming}
                        aria-pressed={thinkingEnabled}
                        title={
                            thinkingEnabled
                                ? "深度思考已开启，点击关闭"
                                : "深度思考已关闭，点击开启"
                        }
                        onClick={() => setThinkingEnabled((value) => !value)}
                    >
                        <span className={style["thinking-toggle-label"]}>
                            深度思考
                        </span>
                        <span
                            className={style["thinking-toggle-switch"]}
                            aria-hidden="true"
                        >
                            <span
                                className={style["thinking-toggle-knob"]}
                            ></span>
                        </span>
                    </button>
                </div>
                <InputBox
                    value={inputValue}
                    isStreaming={isStreaming}
                    isSendDisabled={!inputValue.trim()}
                    onChange={handleOnInputChange}
                    onSend={handleOnSend}
                    onStop={handleOnStop}
                />
            </div>
        </div>
    );
}
