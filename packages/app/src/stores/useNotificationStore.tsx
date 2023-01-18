import { create } from "zustand";
import produce from "immer";

interface NotificationStore {
  notifications: Array<{
    type: string;
    message: string;
    description?: string;
    txid?: string;
  }>;
  set: (x: any) => void;
}

const useNotificationStore = create<NotificationStore>()((set, _get) => ({
  notifications: [],
  set: (fn) => set(produce<NotificationStore>(fn)),
}));

export default useNotificationStore;
