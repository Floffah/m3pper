import { type DragDropManagerInput, Feedback } from "@dnd-kit/dom";
import {
    DragDropProvider,
    type DragEndEvent,
    type DragMoveEvent,
    type DragOverEvent,
    useDraggable,
    useDroppable,
} from "@dnd-kit/react";
import {
    PropsWithChildren,
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";
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
import { cn } from "@/lib/utils";

type DropIntent = {
    targetId: string;
    placement: "before" | "inside" | "after";
};

function getPointerY(event: Event | undefined) {
    if (event && "clientY" in event && typeof event.clientY === "number") {
        return event.clientY;
    }

    return null;
}

function SidebarNode({
    id,
    treeDepth,
    registerRowElement,
    dropIntent,
}: {
    id: string;
    treeDepth: number;
    registerRowElement: (id: string, element: HTMLElement | null) => void;
    dropIntent: DropIntent | null;
}) {
    const node = useMap(useShallow((state) => state.nodes[id]));
    const { ref: draggableRef, isDragSource } = useDraggable({ id });
    const { ref: droppableRef } = useDroppable({ id });
    const isDropTarget = dropIntent?.targetId === id;
    const dropPlacement = isDropTarget ? dropIntent.placement : null;
    const rowRef = useCallback(
        (element: HTMLLIElement | null) => {
            draggableRef(element);
            droppableRef(element);
            registerRowElement(id, element);
        },
        [draggableRef, droppableRef, id, registerRowElement],
    );

    if (!node) return null;

    return (
        <SidebarMenuItem
            ref={rowRef}
            className={cn(isDragSource && "opacity-45")}
            style={{ marginLeft: treeDepth * 12 }}
        >
            {dropPlacement === "before" && (
                <div className="absolute -top-px right-1 left-1 z-10 h-0.5 rounded-full bg-sky-500" />
            )}
            {dropPlacement === "after" && (
                <div className="absolute -right-1 -bottom-px left-1 z-10 h-0.5 rounded-full bg-sky-500" />
            )}
            <SidebarMenuButton
                asChild
                className={cn(
                    dropPlacement === "inside" &&
                        "bg-sky-500/10 text-sidebar-accent-foreground ring-1 ring-sky-500/70",
                )}
            >
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
    const lastPointerY = useRef<number | null>(null);
    const rowElements = useRef(new Map<string, HTMLElement>());
    const [dropIntent, setDropIntent] = useState<DropIntent | null>(null);

    const nodes = useMemo(
        () => flattenMapNodes(nodeMap, rootId),
        [nodeMap, rootId],
    );
    const dndPlugins = useMemo<NonNullable<DragDropManagerInput["plugins"]>>(
        () => (defaultPlugins) =>
            defaultPlugins.map((plugin) =>
                plugin === Feedback
                    ? Feedback.configure({
                          feedback: "clone",
                          dropAnimation: null,
                      })
                    : plugin,
            ),
        [],
    );

    const registerRowElement = useCallback(
        (id: string, element: HTMLElement | null) => {
            if (element) {
                rowElements.current.set(id, element);
                return;
            }

            rowElements.current.delete(id);
        },
        [],
    );

    const getDropIntent = useCallback(
        (targetId: string): DropIntent | null => {
            const targetNode = nodeMap[targetId];
            const targetElement = rowElements.current.get(targetId);
            const pointerY = lastPointerY.current;

            if (!targetNode || !targetElement || pointerY === null) {
                return null;
            }

            const targetRect = targetElement.getBoundingClientRect();
            const pointerOffset = pointerY - targetRect.top;
            const targetZone = pointerOffset / targetRect.height;

            if (targetNode.type === "group") {
                if (targetZone < 1 / 3) {
                    return { targetId, placement: "before" };
                }

                if (targetZone > 2 / 3) {
                    return { targetId, placement: "after" };
                }

                return { targetId, placement: "inside" };
            }

            return {
                targetId,
                placement: targetZone < 0.5 ? "before" : "after",
            };
        },
        [nodeMap],
    );

    const moveInsideGroup = (draggedId: string, targetId: string) => {
        const targetNode = nodeMap[targetId];
        if (!targetNode || targetNode.type !== "group") return false;

        moveNode(draggedId, targetId, targetNode.childrenIds.length);
        return true;
    };

    const moveBesideTarget = (
        draggedId: string,
        targetId: string,
        placement: "before" | "after",
    ) => {
        const targetNode = nodeMap[targetId];
        if (!targetNode || !("parentId" in targetNode)) return false;

        const targetParent = nodeMap[targetNode.parentId];
        if (!targetParent) return false;

        const targetSiblingIndex = targetParent.childrenIds.indexOf(targetId);
        if (targetSiblingIndex === -1) return false;

        const targetIndex =
            placement === "before"
                ? targetSiblingIndex
                : targetSiblingIndex + 1;

        moveNode(draggedId, targetNode.parentId, targetIndex);
        return true;
    };

    const moveToDropIntent = (draggedId: string, intent: DropIntent) => {
        if (intent.placement === "inside") {
            return moveInsideGroup(draggedId, intent.targetId);
        }

        return moveBesideTarget(draggedId, intent.targetId, intent.placement);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const lastTargetId = lastDropTargetId.current;
        lastDropTargetId.current = null;
        setDropIntent(null);

        if (event.canceled) return;

        const { source, target } = event.operation;
        if (!source) return;

        const draggedId = String(source.id);
        const currentTargetId = target ? String(target.id) : null;
        const targetId =
            currentTargetId && currentTargetId !== draggedId
                ? currentTargetId
                : lastTargetId;

        if (targetId && targetId !== draggedId) {
            lastPointerY.current =
                getPointerY(event.nativeEvent) ?? lastPointerY.current;
            const intent = getDropIntent(targetId);

            if (intent) {
                moveToDropIntent(draggedId, intent);
            }

            lastPointerY.current = null;
            return;
        }

        lastPointerY.current = null;
    };

    const handleDragMove = (event: DragMoveEvent) => {
        lastPointerY.current =
            getPointerY(event.nativeEvent) ?? event.to?.y ?? null;

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (sourceId && targetId && sourceId !== targetId) {
            setDropIntent(getDropIntent(String(targetId)));
            return;
        }

        setDropIntent(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (sourceId && targetId && sourceId !== targetId) {
            lastDropTargetId.current = String(targetId);
            setDropIntent(getDropIntent(String(targetId)));
            return;
        }

        setDropIntent(null);
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader></SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Nodes</SidebarGroupLabel>
                        <DragDropProvider
                            plugins={dndPlugins}
                            onDragEnd={handleDragEnd}
                            onDragMove={handleDragMove}
                            onDragOver={handleDragOver}
                        >
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {nodes.map(({ id, treeDepth }) => (
                                        <SidebarNode
                                            key={id}
                                            id={id}
                                            registerRowElement={
                                                registerRowElement
                                            }
                                            dropIntent={dropIntent}
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
