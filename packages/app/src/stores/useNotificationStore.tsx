import { create } from "zustand";
import produce from "immer";

export interface NotificationType {
  type: string;
  message: string;
  description?: string;
  txid?: string;
}

interface NotificationStore {
  notifications: NotificationType[];
  set: (x: any) => void;
}

const useNotificationStore = create<NotificationStore>()((set, _get) => ({
  notifications: [],
  set: (fn) => set(produce<NotificationStore>(fn)),
}));

export default useNotificationStore;
