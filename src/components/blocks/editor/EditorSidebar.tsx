import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { PropsWithChildren, useMemo } from "react";
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
    const nodes = useMemo(
        () => flattenMapNodes(nodeMap, rootId),
        [nodeMap, rootId],
    );

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader></SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Nodes</SidebarGroupLabel>
                        <DragDropProvider>
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
