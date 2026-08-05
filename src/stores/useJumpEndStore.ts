import { create } from "zustand";

type JumpEndStore = {
  remove: (() => void) | null;
  setRemove: (func: () => void) => void;
};

const useJumpEndStore = create<JumpEndStore>((set) => ({
  remove: null,  // 默认空函数
  setRemove: (func: () => void) => {
    set({ remove: func });  // 直接更新 remove 字段
  },
}));
export default useJumpEndStore;
export type {
    JumpEndStore,
}