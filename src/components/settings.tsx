import style from "../css/settings.module.less"
import { Link } from "react-router-dom"
import React, { useLayoutEffect } from "react"
import gsap from "gsap"

export function TopMenu({ onClose, containerRef }: {
    onClose: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}) {
    async function handleOnClose() {
        if (!containerRef.current) return;
        await gsap.to(
            containerRef.current, {
                rotate: 45,
                scale: 0,
                duration: .334,
                ease: "expo.in",
            }
        )
        onClose()
    }
    return <div className={style['top-menu']}>
        <div className={style['top-menu-info-area']}>
            <h1>设置</h1>
        </div>
        <button
            className={style['top-menu-close-button']}
            onClick={handleOnClose}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                <line x1="10" y1="10" x2="90" y2="90" strokeWidth="8" strokeLinecap="round" />
                <line x1="90" y1="10" x2="10" y2="90" strokeWidth="8" strokeLinecap="round" />
            </svg>
        </button>
    </div>
}

export function Container({
    children,
    onClose
}: {
    children: React.ReactNode,
    onClose: () => void;
}) {
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    useLayoutEffect(()=>{
        if(!containerRef.current) return;
        gsap.set(containerRef.current, {
            scale: 0,
            rotate: 45,
        })
        gsap.to(containerRef.current, {
            scale: 1,
            rotate: 0,
            duration: .334,
            ease: "expo.out",
        })
    },[])
    return <div className={style.container} ref={containerRef}>
        <div className={style["shadow-background-3"]}>
        </div>
        <div className={style["shadow-background-2"]}>
        </div>
        <div className={
            style["shadow-background"]
        }></div>
        <div className={style['container-inner']}>
            <TopMenu
                onClose={onClose}
                containerRef={containerRef}
            />
            {children}
        </div>
    </div>
}

type ModelEditorState = {
    id: string | null;
    name: string;
    baseURL: string;
    model: string;
    apiKey: string;
    description: string;
    systemPrompt: string;
};

export function ModelEditor({
    editor,
    isBuiltin,
    presets,
    selectedPresetId,
    onChange,
    onPresetChange,
}: {
    editor: ModelEditorState;
    isBuiltin: boolean;
    presets: AIModelConfig[];
    selectedPresetId: string;
    onChange: (next: ModelEditorState) => void;
    onPresetChange: (presetId: string) => void;
}) {
    function update(patch: Partial<ModelEditorState>) {
        onChange({ ...editor, ...patch });
    }

    function handlePresetChange(presetId: string) {
        onPresetChange(presetId);
        const preset = presets.find((item) => item.id === presetId);
        if (!preset) return;
        update({
            name: preset.name,
            baseURL: preset.baseURL,
            model: preset.model,
            description: preset.description,
            systemPrompt: preset.systemPrompt,
        });
    }

    const isCreating = editor.id === null;

    return (
        <div className={style["model-editor"]}>
            {isCreating && (
                <label className={style["settings-field"]}>
                    <span className={style["settings-label"]}>预设</span>
                    <select
                        className={style["settings-select"]}
                        value={selectedPresetId}
                        onChange={(e) => handlePresetChange(e.target.value)}
                    >
                        <option value="">不使用预设</option>
                        {presets.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                                {preset.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>名称</span>
                <input
                    className={style["settings-input"]}
                    type="text"
                    placeholder="例如：我的 GPT-4o"
                    value={editor.name}
                    disabled={isBuiltin}
                    onChange={(e) => update({ name: e.target.value })}
                />
            </label>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>Base URL</span>
                <input
                    className={style["settings-input"]}
                    type="text"
                    placeholder="https://api.example.com/v1"
                    value={editor.baseURL}
                    disabled={isBuiltin}
                    onChange={(e) => update({ baseURL: e.target.value })}
                />
            </label>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>模型名</span>
                <input
                    className={style["settings-input"]}
                    type="text"
                    placeholder="your-model-name"
                    value={editor.model}
                    disabled={isBuiltin}
                    onChange={(e) => update({ model: e.target.value })}
                />
            </label>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>API Key</span>
                <input
                    className={style["settings-input"]}
                    type="password"
                    placeholder={isBuiltin ? "填入该模型的 API Key" : "填入 API Key"}
                    value={editor.apiKey}
                    onChange={(e) => update({ apiKey: e.target.value })}
                />
            </label>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>描述</span>
                <input
                    className={style["settings-input"]}
                    type="text"
                    placeholder="这个模型用来干什么"
                    value={editor.description}
                    disabled={isBuiltin}
                    onChange={(e) => update({ description: e.target.value })}
                />
            </label>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>系统提示词</span>
                <textarea
                    className={`${style["settings-input"]} ${style["settings-textarea"]}`}
                    placeholder="给模型设定角色或行为规则"
                    rows={4}
                    value={editor.systemPrompt}
                    disabled={isBuiltin}
                    onChange={(e) => update({ systemPrompt: e.target.value })}
                />
            </label>
            {isBuiltin && (
                <p className={style["settings-tip"]}>
                    内置模型只能修改 API Key，名称和接口由官方预设决定。
                </p>
            )}
        </div>
    );
}

export function ModelCard({
    model,
    isActive,
    confirmDelete,
    onSelect,
    onEdit,
    onDelete,
    onBlurDelete,
}: {
    model: AIModelConfig;
    isActive: boolean;
    confirmDelete: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onBlurDelete: () => void;
}) {
    return (
        <div
            className={`${style["model-card"]} ${
                isActive ? style["model-card-active"] : ""
            }`}
            onClick={onSelect}
        >
            <div className={style["model-card-head"]}>
                <span className={style["model-card-name"]}>
                    {model.name}
                </span>
                <span className={style["model-card-badge"]}>
                    {model.builtin ? "内置" : "自定义"}
                </span>
            </div>
            <div className={style["model-card-meta"]}>
                <span>模型：{model.model || "（未填写）"}</span>
                <span>
                    接口：{model.baseURL || "（未填写）"}
                </span>
                <span>
                    API Key：
                    {model.apiKey ? "已配置" : "未配置"}
                </span>
            </div>
            {model.description && (
                <p className={style["model-card-description"]}>
                    {model.description}
                </p>
            )}
            <div
                className={style["model-card-actions"]}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={style["model-card-action-button"]}
                    onClick={onEdit}
                >
                    编辑
                </button>
                {!model.builtin && (
                    <button
                        type="button"
                        className={`${style["model-card-action-button"]} ${style["model-card-delete-button"]}`}
                        onBlur={onBlurDelete}
                        onClick={onDelete}
                    >
                        {confirmDelete ? "确认删除?" : "删除"}
                    </button>
                )}
            </div>
        </div>
    );
}

export function ModelGrid({
    models,
    activeModelId,
    confirmDeleteId,
    onSelect,
    onEdit,
    onDelete,
    onBlurDelete,
}: {
    models: AIModelConfig[];
    activeModelId: string;
    confirmDeleteId: string | null;
    onSelect: (id: string) => void;
    onEdit: (model: AIModelConfig) => void;
    onDelete: (id: string) => void;
    onBlurDelete: () => void;
}) {
    return (
        <div className={style["model-grid"]}>
            {models.map((model) => (
                <ModelCard
                    key={model.id}
                    model={model}
                    isActive={model.id === activeModelId}
                    confirmDelete={confirmDeleteId === model.id}
                    onSelect={() => onSelect(model.id)}
                    onEdit={() => onEdit(model)}
                    onDelete={() => onDelete(model.id)}
                    onBlurDelete={onBlurDelete}
                />
            ))}
        </div>
    );
}

export function SettingsBody({ children }: { children: React.ReactNode }) {
    return <div className={style["settings-body"]}>{children}</div>;
}

export function SettingsSection({ children }: { children: React.ReactNode }) {
    return <section className={style["settings-section"]}>{children}</section>;
}

export function SettingsSectionHead({
    title,
    actionButton,
}: {
    title: string;
    actionButton?: React.ReactNode;
}) {
    return (
        <div className={style["settings-section-head"]}>
            <h2 className={style["settings-section-title"]}>{title}</h2>
            {actionButton}
        </div>
    );
}

export function SettingsActionButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={style["settings-action-button"]}
            onClick={onClick}
        >
            {children}
        </button>
    );
}


export function SettingsDescription({ children }: { children: React.ReactNode }) {
    return <span className={style["settings-description"]}>{children}</span>
}
export function SettingsAboutButton({
    children
}: {
    children: React.ReactNode
}){
    return <Link to="/about" className={style["settings-about-button"]}>{children}</Link>
}

export function SettingsActionButtonSecondary({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className={style["settings-action-button-secondary"]}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function SettingsEditorActions({
    onSave,
    onCancel,
}: {
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className={style["settings-editor-actions"]}>
            <SettingsActionButton onClick={onSave}>保存</SettingsActionButton>
            <SettingsActionButtonSecondary onClick={onCancel}>
                取消
            </SettingsActionButtonSecondary>
        </div>
    );
}

export function SettingsEmpty({ children }: { children: React.ReactNode }) {
    return <p className={style["settings-empty"]}>{children}</p>;
}

export function SettingsError({ children }: { children: React.ReactNode }) {
    return <p className={style["settings-error"]}>{children}</p>;
}

export function SettingsActiveModelTip({
    activeModel,
}: {
    activeModel: AIModelConfig | null;
}) {
    return (
        <p className={style["settings-tip"]}>
            当前模型：
            {activeModel
                ? `${activeModel.name}（${activeModel.model || "未填写"}）`
                : "未选择"}
            {activeModel &&
                !activeModel.apiKey &&
                "，未配置 API Key，将使用铁屋AI本地发电模式"}
        </p>
    );
}

export type UserEditorState = {
    name: string;
    password: string;
};

export function UserEditor({
    user,
    onChange,
}: {
    user: UserEditorState;
    onChange: (next: UserEditorState) => void;
}) {
    return (
        <div className={style["model-editor"]}>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>用户名</span>
                <input
                    className={style["settings-input"]}
                    type="text"
                    placeholder="用户名"
                    value={user.name}
                    onChange={(e) => onChange({ ...user, name: e.target.value })}
                />
            </label>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>新密码</span>
                <input
                    className={style["settings-input"]}
                    type="password"
                    placeholder="留空则不修改密码"
                    value={user.password}
                    onChange={(e) => onChange({ ...user, password: e.target.value })}
                />
            </label>
        </div>
    );
}

export function SystemPromptEditor({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className={style["model-editor"]}>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>系统提示词（默认提示词由KIMI生成）</span>
                <textarea
                    className={`${style["settings-input"]} ${style["settings-textarea"]}`}
                    placeholder="给所有模型设定默认角色或行为规则"
                    rows={6}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </label>
        </div>
    );
}

export function AccountDeletion({
    userName,
    confirmName,
    onConfirmNameChange,
    onDelete,
}: {
    userName: string;
    confirmName: string;
    onConfirmNameChange: (value: string) => void;
    onDelete: () => void;
}) {
    const canDelete = confirmName.trim() === userName.trim() && userName.trim() !== "";
    return (
        <div className={style["account-deletion"]}>
            <p className={style["account-deletion-warning"]}>
                警告：注销账号将清除所有本地数据（用户、对话记录、模型设置等），该操作不可恢复。
            </p>
            <label className={style["settings-field"]}>
                <span className={style["settings-label"]}>输入用户名确认注销</span>
                <input
                    className={style["settings-input"]}
                    type="text"
                    placeholder={`请输入「${userName}」以确认`}
                    value={confirmName}
                    onChange={(e) => onConfirmNameChange(e.target.value)}
                />
            </label>
            <button
                type="button"
                className={style["account-deletion-button"]}
                disabled={!canDelete}
                onClick={onDelete}
            >
                确认注销账号
            </button>
        </div>
    );
}

export { type ModelEditorState };
