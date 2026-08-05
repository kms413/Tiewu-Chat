import localforage from "localforage";
import SYS_PROMPT from "../assets/system.prompt.txt?raw"
import { setGlobalSystemPrompt } from "./system.prompt";
import { INSTANCE_NAME, DATA_KEY } from "./user.data";

export default async function initUserData() {
  const instance = localforage.createInstance({
    name: INSTANCE_NAME,
  });
  setGlobalSystemPrompt(SYS_PROMPT)
  await instance.setItem<UserData>(DATA_KEY, {
    AIs: {},
  });
}
