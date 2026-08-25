import useAIModelsStore from "../stores/useAIModelsStore";
import { setGlobalSystemPrompt } from "./system.prompt";

export async function updateBuiltinModels() {
  const AI_ASSETS = await import("../assets/builtin.models");

  useAIModelsStore
    .getState()
    .overwriteModels([
      ...AI_ASSETS.BUILTIN_AI_MODELS,
      ...useAIModelsStore.getState().models.filter((a) => !a.builtin),
    ]);
}
export async function updateSystemPrompt() {
  const DEFAULT_SYS_PROMPT = (await import("../assets/system.prompt.txt?raw")).default
  setGlobalSystemPrompt(DEFAULT_SYS_PROMPT)
}
