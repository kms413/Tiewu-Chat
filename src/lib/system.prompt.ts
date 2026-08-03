const GLOBAL_SYSTEM_PROMPT_KEY = "global-system-prompt";

export function getGlobalSystemPrompt(): string {
    try {
        return localStorage.getItem(GLOBAL_SYSTEM_PROMPT_KEY) ?? "";
    } catch {
        return "";
    }
}

export function setGlobalSystemPrompt(prompt: string): void {
    try {
        localStorage.setItem(GLOBAL_SYSTEM_PROMPT_KEY, prompt);
    } catch {
        // 存储失败时静默忽略
    }
}
