import {
    DragDropProvider,
    type DragEndEvent,
    type DragOverEvent,
} from "@dnd-kit/react";
import { isSortableOperation, useSortable } from "@dnd-kit/react/sortable";
import { PropsWithChildren, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useMap } from "@/components/providers/MapProvider";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { flattenMapNodes } from "@/lib/state/map";

function SidebarNode({
    id,
    index,
    treeDepth,
}: {
    id: string;
    index: number;
    treeDepth: number;
}) {
    const node = useMap(useShallow((state) => state.nodes[id]));
    const { ref } = useSortable({ id, index });

    if (!node) return null;

    return (
        <SidebarMenuItem ref={ref} style={{ marginLeft: treeDepth * 12 }}>
            <SidebarMenuButton asChild>
                <span>
                    {node.type} ({node.id})
                </span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function EditorSidebar({ children }: PropsWithChildren) {
    const nodeMap = useMap(useShallow((state) => state.nodes));
    const rootId = useMap(useShallow((state) => state.rootId));
    const moveNode = useMap(useShallow((state) => state.moveNode));
    const lastDropTargetId = useRef<string | null>(null);

    const nodes = useMemo(
        () => flattenMapNodes(nodeMap, rootId),
        [nodeMap, rootId],
    );

    const moveAfterTarget = (draggedId: string, targetId: string) => {
        const targetNode = nodeMap[targetId];
        if (!targetNode) return;

        if (targetNode.type === "group") {
            moveNode(draggedId, targetId, targetNode.childrenIds.length);
            return;
        }

        if (!("parentId" in targetNode)) return;

        const targetParent = nodeMap[targetNode.parentId];
        if (!targetParent) return;

        const targetSiblingIndex = targetParent.childrenIds.indexOf(targetId);
        if (targetSiblingIndex === -1) return;

        moveNode(draggedId, targetNode.parentId, targetSiblingIndex + 1);
    };

    const moveToProjectedIndex = (draggedId: string, targetIndex: number) => {
        const nodesWithoutDragged = nodes.filter(({ id }) => id !== draggedId);
        const nodeAtIndex = nodesWithoutDragged[targetIndex];
        const previousNode = nodesWithoutDragged[targetIndex - 1];

        if (nodeAtIndex && "parentId" in nodeAtIndex.node) {
            const targetParent = nodeMap[nodeAtIndex.node.parentId];
            if (!targetParent) return;

            const targetSiblingIndex = targetParent.childrenIds.indexOf(
                nodeAtIndex.id,
            );
            if (targetSiblingIndex === -1) return;

            moveNode(draggedId, nodeAtIndex.node.parentId, targetSiblingIndex);
            return;
        }

        if (previousNode && "parentId" in previousNode.node) {
            const targetParent = nodeMap[previousNode.node.parentId];
            if (!targetParent) return;

            const targetSiblingIndex = targetParent.childrenIds.indexOf(
                previousNode.id,
            );
            if (targetSiblingIndex === -1) return;

            moveNode(
                draggedId,
                previousNode.node.parentId,
                targetSiblingIndex + 1,
            );
            return;
        }

        moveNode(draggedId, rootId, 0);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const lastTargetId = lastDropTargetId.current;
        lastDropTargetId.current = null;

        if (event.canceled || !isSortableOperation(event.operation)) return;

        const { source, target } = event.operation;
        if (!source) return;

        const draggedId = String(source.id);
        const targetId = target ? String(target.id) : lastTargetId;

        if (targetId && targetId !== draggedId) {
            moveAfterTarget(draggedId, targetId);
            return;
        }

        if (source.index !== source.initialIndex) {
            moveToProjectedIndex(draggedId, source.index);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (sourceId && targetId && sourceId !== targetId) {
            lastDropTargetId.current = String(targetId);
        }
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader></SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Nodes</SidebarGroupLabel>
                        <DragDropProvider
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                        >
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {nodes.map(({ id, treeDepth }, idx) => (
                                        <SidebarNode
                                            key={id}
                                            id={id}
                                            index={idx}
                                            treeDepth={treeDepth}
                                        />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </DragDropProvider>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}
