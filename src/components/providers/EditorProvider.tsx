"use client";

import {
    PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useShallow } from "zustand/react/shallow";

import { useMap } from "@/components/providers/MapProvider";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { createUseEditor } from "@/lib/state/editor";

const EditorContext = createContext<ReturnType<typeof createUseEditor>>(null!);

export default function EditorProvider({ children }: PropsWithChildren) {
    const useEditor = useMemo(() => createUseEditor(), []);
    const editor = useEditor();

    const selectedNode = useMap(
        useShallow((state) => state.nodes[editor.selectedNodeIds[0]]),
    );
    const deleteNode = useMap(useShallow((state) => state.deleteNode));

    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editor.contextMenuOpen) {
            console.log("f");
            triggerRef.current?.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: editor.contextMenuX,
                    clientY: editor.contextMenuY,
                }),
            );
        }
    }, [editor.contextMenuOpen, editor.contextMenuX, editor.contextMenuY]);

    return (
        <EditorContext.Provider value={useEditor}>
            {children}

            <ContextMenu onOpenChange={editor.closeContextMenu}>
                <ContextMenuTrigger
                    ref={triggerRef}
                    className="pointer-events-none fixed h-1 w-1"
                    style={{
                        left: editor.contextMenuX,
                        top: editor.contextMenuY,
                    }}
                />

                <ContextMenuContent className="min-w-40">
                    {selectedNode?.type === "box" && (
                        <>
                            <ContextMenuLabel>
                                Node {selectedNode.id} ({selectedNode.type})
                            </ContextMenuLabel>
                            <ContextMenuGroup>
                                <ContextMenuItem
                                    onClick={() => deleteNode(selectedNode.id)}
                                >
                                    Delete
                                </ContextMenuItem>
                            </ContextMenuGroup>
                        </>
                    )}
                </ContextMenuContent>
            </ContextMenu>
        </EditorContext.Provider>
    );
}

export const useEditor = ((selector) => {
    const useEditor = useContext(EditorContext);

    if (!useEditor) {
        throw new Error("useEditor must be used within an EditorProvider");
    }

    return useEditor(selector);
}) as ReturnType<typeof createUseEditor>;
