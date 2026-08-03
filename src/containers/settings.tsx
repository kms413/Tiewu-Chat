import React from "react";
import { useNavigate } from "react-router-dom";
import localforage from "localforage";
import {
    Container,
    ModelEditor,
    ModelGrid,
    SettingsBody,
    SettingsSection,
    SettingsSectionHead,
    SettingsActionButton,
    SettingsEditorActions,
    SettingsEmpty,
    SettingsError,
    SettingsActiveModelTip,
    UserEditor,
    SystemPromptEditor,
    AccountDeletion,
    type ModelEditorState,
    type UserEditorState,
} from "../components/settings";
import useAIModelsStore from "../stores/useAIModelsStore";
import { BUILTIN_AI_MODELS } from "../lib/ai.models";
import useStoredState from "../lib/useStoredState";
import { sha256 } from "../lib/hash";
import { getGlobalSystemPrompt, setGlobalSystemPrompt } from "../lib/system.prompt";

const EMPTY_EDITOR: ModelEditorState = {
    id: null,
    name: "",
    baseURL: "",
    model: "",
    apiKey: "",
    description: "",
    systemPrompt: "",
};

function Settings({ onClose }: { onClose: () => void }) {
    const navigate = useNavigate();
    const models = useAIModelsStore((state) => state.models);
    const activeModelId = useAIModelsStore((state) => state.activeModelId);
    const [editor, setEditor] = React.useState<ModelEditorState | null>(null);
    const [selectedPresetId, setSelectedPresetId] = React.useState("");
    const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
        null
    );
    const [errorText, setErrorText] = React.useState("");

    const [user, setUser] = useStoredState<User>("user", null);
    const [userEditor, setUserEditor] = React.useState<UserEditorState>({
        name: user?.name ?? "",
        password: "",
    });
    const [userErrorText, setUserErrorText] = React.useState("");

    const [systemPrompt, setSystemPrompt] = React.useState(() => getGlobalSystemPrompt());
    const [confirmUserName, setConfirmUserName] = React.useState("");
    const [deleteErrorText, setDeleteErrorText] = React.useState("");

    const activeModel = models.find((model) => model.id === activeModelId) ?? null;
    const editingBuiltin =
        editor?.id !== null &&
        editor?.id !== undefined &&
        (models.find((model) => model.id === editor.id)?.builtin ?? false);

    function startCreate() {
        setEditor({ ...EMPTY_EDITOR });
        setSelectedPresetId("");
        setErrorText("");
    }

    function startEdit(model: AIModelConfig) {
        setEditor({
            id: model.id,
            name: model.name,
            baseURL: model.baseURL,
            model: model.model,
            apiKey: model.apiKey,
            description: model.description,
            systemPrompt: model.systemPrompt,
        });
        setSelectedPresetId("");
        setErrorText("");
    }

    function handleSelectModel(id: string) {
        useAIModelsStore.getState().setActiveModel(id);
    }

    function handleSave() {
        if (!editor) {
            return;
        }
        const name = editor.name.trim();
        const baseURL = editor.baseURL.trim();
        const model = editor.model.trim();
        if (!name || !baseURL || !model) {
            setErrorText("名称、Base URL、模型名不能为空");
            return;
        }
        const apiKey = editor.apiKey.trim();
        if (editingBuiltin && editor.id) {
            useAIModelsStore.getState().updateModel(editor.id, { apiKey });
        } else if (editor.id) {
            useAIModelsStore
                .getState()
                .updateModel(editor.id, {
                    name,
                    baseURL,
                    model,
                    apiKey,
                    description: editor.description.trim(),
                    systemPrompt: editor.systemPrompt.trim(),
                });
        } else {
            useAIModelsStore
                .getState()
                .addModel({
                    name,
                    baseURL,
                    model,
                    apiKey,
                    description: editor.description.trim(),
                    systemPrompt: editor.systemPrompt.trim(),
                });
        }
        setEditor(null);
        setSelectedPresetId("");
        setErrorText("");
    }

    function handleDelete(id: string) {
        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id);
            return;
        }
        setConfirmDeleteId(null);
        useAIModelsStore.getState().removeModel(id);
    }

    function handleCancelEdit() {
        setEditor(null);
        setSelectedPresetId("");
        setErrorText("");
    }

    function handlePresetChange(presetId: string) {
        setSelectedPresetId(presetId);
    }

    function handleSaveSystemPrompt() {
        setGlobalSystemPrompt(systemPrompt.trim());
    }

    function handleCancelSystemPrompt() {
        setSystemPrompt(getGlobalSystemPrompt());
    }

    async function handleDeleteAccount() {
        if (!user || confirmUserName.trim() !== user.name.trim()) {
            setDeleteErrorText("用户名输入不正确");
            return;
        }
        try {
            localStorage.removeItem("user");
            localStorage.removeItem("global-system-prompt");
            localStorage.removeItem("ai-models");
            localStorage.removeItem("ai-settings");
            await localforage.dropInstance({ name: "userdata" });
            await localforage.dropInstance({ name: "chat-history" });
            navigate("/start");
        } catch {
            setDeleteErrorText("注销失败，请重试");
        }
    }

    async function handleSaveUser() {
        const name = userEditor.name.trim();
        if (!name) {
            setUserErrorText("用户名不能为空");
            return;
        }
        const password = userEditor.password.trim();
        const passwordHash = password
            ? await sha256(password)
            : (user?.password ?? await sha256("滚木"));
        setUser({ name, password: passwordHash });
        setUserEditor({ name, password: "" });
        setUserErrorText("");
    }

    function handleCancelUser() {
        setUserEditor({ name: user?.name ?? "", password: "" });
        setUserErrorText("");
    }

    return (
        <Container onClose={onClose}>
            <SettingsBody>
                <SettingsSection>
                    <SettingsSectionHead 
                        title="用户设置"
                    />

                </SettingsSection>
                <SettingsSection>
                    <SettingsSectionHead
                        title="AI 模型"
                        actionButton={
                            <SettingsActionButton onClick={startCreate}>
                                + 新建模型
                            </SettingsActionButton>
                        }
                    />
                    <ModelGrid
                        models={models}
                        activeModelId={activeModelId}
                        confirmDeleteId={confirmDeleteId}
                        onSelect={handleSelectModel}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        onBlurDelete={() => setConfirmDeleteId(null)}
                    />
                    {models.length === 0 && (
                        <SettingsEmpty>
                            暂无模型，点击“新建模型”添加
                        </SettingsEmpty>
                    )}
                </SettingsSection>
                {editor && (
                    <SettingsSection>
                        <SettingsSectionHead
                            title={editor.id ? "编辑模型" : "新建模型"}
                        />
                        <ModelEditor
                            editor={editor}
                            isBuiltin={editingBuiltin}
                            presets={BUILTIN_AI_MODELS}
                            selectedPresetId={selectedPresetId}
                            onChange={setEditor}
                            onPresetChange={handlePresetChange}
                        />
                        {errorText && (
                            <SettingsError>{errorText}</SettingsError>
                        )}
                        <SettingsEditorActions
                            onSave={handleSave}
                            onCancel={handleCancelEdit}
                        />
                    </SettingsSection>
                )}
                <SettingsSection>
                    <SettingsSectionHead title="系统提示词" />
                    <SystemPromptEditor
                        value={systemPrompt}
                        onChange={setSystemPrompt}
                    />
                    <SettingsEditorActions
                        onSave={handleSaveSystemPrompt}
                        onCancel={handleCancelSystemPrompt}
                    />
                </SettingsSection>
                <SettingsSection>
                    <SettingsSectionHead title="用户设置" />
                    <UserEditor
                        user={userEditor}
                        onChange={setUserEditor}
                    />
                    {userErrorText && (
                        <SettingsError>{userErrorText}</SettingsError>
                    )}
                    <SettingsEditorActions
                        onSave={handleSaveUser}
                        onCancel={handleCancelUser}
                    />
                </SettingsSection>
                <SettingsSection>
                    <SettingsSectionHead title="账号注销" />
                    <AccountDeletion
                        userName={user?.name ?? ""}
                        confirmName={confirmUserName}
                        onConfirmNameChange={setConfirmUserName}
                        onDelete={handleDeleteAccount}
                    />
                    {deleteErrorText && (
                        <SettingsError>{deleteErrorText}</SettingsError>
                    )}
                </SettingsSection>
                <SettingsActiveModelTip activeModel={activeModel} />
            </SettingsBody>
        </Container>
    );
}

export default Settings;
