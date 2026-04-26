import { create } from "zustand/react";

interface EditorState {
    selectedNodeIds: string[];
    contextMenuOpen: boolean;
    contextMenuX: number;
    contextMenuY: number;
}

interface EditorActions {
    selectNode: (nodeId: string) => void;
    deselectNode: (nodeId: string) => void;
    clearSelection: () => void;
    openContextMenu: (x: number, y: number) => void;
    closeContextMenu: () => void;
}

export const defaultEditorState: EditorState = {
    selectedNodeIds: [],
    contextMenuOpen: false,
    contextMenuX: 0,
    contextMenuY: 0,
};

export type EditorStore = EditorState & EditorActions;

export const createUseEditor = () =>
    create<EditorStore>((set) => ({
        ...defaultEditorState,

        selectNode: (nodeId) =>
            set((state) => ({
                selectedNodeIds: [...state.selectedNodeIds, nodeId],
            })),
        deselectNode: (nodeId) =>
            set((state) => ({
                selectedNodeIds: state.selectedNodeIds.filter(
                    (id) => id !== nodeId,
                ),
            })),
        clearSelection: () => set({ selectedNodeIds: [] }),
        openContextMenu: (x, y) =>
            set({
                contextMenuOpen: true,
                contextMenuX: x,
                contextMenuY: y,
            }),
        closeContextMenu: () => set({ contextMenuOpen: false }),
    }));
