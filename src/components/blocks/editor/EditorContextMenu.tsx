"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useEditor } from "@/components/providers/EditorProvider";
import { useMap } from "@/components/providers/MapProvider";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function EditorContextMenu() {
    const editor = useEditor();

    const selectedNodes = useMap(
        useShallow((state) =>
            editor.selectedNodeIds.map((id) => state.nodes[id]),
        ),
    );
    const hasSelectedNodes = selectedNodes.length > 0;
    const isSelectedNodesSoleType = selectedNodes.every(
        (node) => node?.type === selectedNodes[0]?.type,
    );
    const selectedNodeSoleType = isSelectedNodesSoleType
        ? selectedNodes[0]?.type
        : null;

    const deleteNodes = useMap(useShallow((state) => state.deleteNodes));

    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editor.contextMenuOpen) {
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
                <ContextMenuLabel>
                    {selectedNodes.length === 1 &&
                        selectedNodes[0] &&
                        `Node ${selectedNodes[0].id} (${selectedNodes[0].type})`}
                    {selectedNodes.length > 1 &&
                        `${selectedNodes.length} selected nodes`}
                    {selectedNodes.length > 1 &&
                        isSelectedNodesSoleType &&
                        ` (${selectedNodeSoleType})`}
                    {selectedNodes.length === 0 && "No node selected"}
                </ContextMenuLabel>

                {hasSelectedNodes && (
                    <>
                        <ContextMenuGroup>
                            <ContextMenuItem
                                onClick={() =>
                                    deleteNodes(editor.selectedNodeIds)
                                }
                            >
                                Delete
                            </ContextMenuItem>
                        </ContextMenuGroup>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
