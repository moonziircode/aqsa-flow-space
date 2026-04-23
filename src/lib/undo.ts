import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Global Undo store
 * ------------------
 * Captures every reversible action (delete / status change / edit / drag …)
 * onto a single linear stack. Pressing Ctrl/Cmd+Z (anywhere outside an active
 * text input) replays the most recent action's `undo()` callback.
 *
 * Each `UndoAction` carries its own `undo()` thunk which is responsible for
 * restoring optimistic UI state AND persisting the reversal to the database.
 */

export type UndoAction = {
  label: string; // human-readable description: "Deleted task", "Moved card", …
  undo: () => Promise<void> | void;
};

const STACK_LIMIT = 50;

type Listener = () => void;
const listeners = new Set<Listener>();
let stack: UndoAction[] = [];

function emit() {
  listeners.forEach((l) => l());
}

export const undoStore = {
  push(action: UndoAction) {
    stack.push(action);
    if (stack.length > STACK_LIMIT) stack.shift();
    emit();
  },
  async pop(): Promise<UndoAction | null> {
    const a = stack.pop() ?? null;
    emit();
    return a;
  },
  size() {
    return stack.length;
  },
  clear() {
    stack = [];
    emit();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/**
 * Push a reversible action onto the global stack.
 * Call this AFTER successfully performing the forward action.
 */
export function recordUndo(action: UndoAction) {
  undoStore.push(action);
}

/**
 * Trigger the most recent undo. Used by the keyboard listener and any
 * "Undo" toast button.
 */
export async function triggerUndo() {
  const action = await undoStore.pop();
  if (!action) {
    toast.message("Nothing to undo");
    return;
  }
  try {
    await action.undo();
    toast.success(`Undone: ${action.label}`);
  } catch (e: any) {
    toast.error(`Undo failed: ${e?.message ?? "unknown error"}`);
  }
}

/**
 * Hook: mounts a single global Ctrl/Cmd+Z keydown listener.
 * Skipped when the user is actively typing inside an input/textarea/contenteditable
 * so we don't fight native text-input undo behaviour.
 */
export function useGlobalUndoHotkey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isUndo =
        (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z";
      if (!isUndo) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const editable =
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          (target as HTMLElement).isContentEditable;
        if (editable) return; // let native undo handle it
      }

      e.preventDefault();
      void triggerUndo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}