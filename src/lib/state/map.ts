import { nanoid } from "nanoid";
import { create } from "zustand/react";

interface BaseNode {
    id: string;
    type?: string;
    parentId: string;
    childrenIds: string[];

    transform: {
        position: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
    };

    material?: {
        color: string;
        opacity: number;
    };
}

interface BoxNode extends BaseNode {
    type: "box";
    width: number;
    height: number;
    depth: number;
}

interface SphereNode extends BaseNode {
    type: "sphere";
    radius: number;
}

interface GroupNode extends BaseNode {
    type: "group";
}

interface RootNode extends Omit<GroupNode, "parentId"> {
    id: "root";
}

type Node = BoxNode | SphereNode | GroupNode;

type OptimisticNode = Omit<Node, keyof BaseNode> &
    Pick<Node, "type"> &
    Partial<BaseNode>;

interface MapState {
    rootId: string;
    nodes: Record<string, Node | RootNode>;
}

interface MapActions {
    addNode: (node: OptimisticNode) => Node;
    reparentNode: (nodeId: string, node: Node) => void;
    updateNode: (nodeId: string, node: Node) => void;
    groupSelectedNodes: (nodeIds: string[]) => void;
    deleteNode: (nodeId: string) => void;
}

export type MapStore = MapState & MapActions;

export const defaultInitState: MapState = {
    rootId: "root",
    nodes: {
        root: {
            id: "root",
            type: "group",
            childrenIds: ["box-1"],
            transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
        },
        "box-1": {
            id: "box-1",
            type: "box",
            parentId: "root",
            childrenIds: [],
            transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
            width: 1,
            height: 1,
            depth: 1,
        },
    },
};

export const createUseMap = () =>
    create<MapStore>((set) => ({
        ...defaultInitState,

        addNode: (node, parentId: Node["parentId"] = "root") => {
            const id = node.id || nanoid();
            const newNode = {
                id,
                parentId,
                childrenIds: [],
                transform: {
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                },
                ...node,
            } as Node;

            set((state) => ({
                nodes: {
                    ...state.nodes,
                    [id]: newNode,
                    [parentId]: {
                        ...state.nodes[parentId],
                        childrenIds: [...state.nodes[parentId].childrenIds, id],
                    },
                },
            }));

            return newNode as Node;
        },

        reparentNode: (nodeId, node) =>
            set((state) => {
                const parent = state.nodes[node.parentId];

                return {
                    nodes: {
                        ...state.nodes,
                        [nodeId]: {
                            ...state.nodes[nodeId],
                            parentId: node.parentId,
                        },
                        [parent.id]: {
                            ...parent,
                            childrenIds: [...parent.childrenIds, nodeId],
                        },
                    },
                };
            }),

        updateNode: (nodeId, node) =>
            set((state) => ({
                nodes: {
                    ...state.nodes,
                    [nodeId]: {
                        ...state.nodes[nodeId],
                        ...node,
                    },
                },
            })),

        groupSelectedNodes: (nodeIds) =>
            set((state) => {
                const groupId = nanoid();

                const newNodes = nodeIds.reduce((acc, nodeId) => {
                    const node = state.nodes[nodeId];
                    if (!node) return acc;

                    return {
                        ...acc,
                        [nodeId]: {
                            ...node,
                            parentId: groupId,
                        },
                    };
                }, {});

                return {
                    nodes: {
                        ...state.nodes,
                        [groupId]: {
                            id: groupId,
                            type: "group",
                            transform: {
                                position: [0, 0, 0],
                                rotation: [0, 0, 0],
                                scale: [1, 1, 1],
                            },
                        },
                        ...newNodes,
                    },
                };
            }),

        deleteNode: (nodeId) =>
            set((state) => {
                const node = state.nodes[nodeId];
                if (!node || !("parentId" in node)) return state;

                const parent = state.nodes[node.parentId];
                if (!parent) return state;

                const newNodes = { ...state.nodes };
                delete newNodes[nodeId];

                return {
                    nodes: {
                        ...newNodes,
                        [parent.id]: {
                            ...parent,
                            childrenIds: parent.childrenIds.filter(
                                (id) => id !== nodeId,
                            ),
                        },
                    },
                };
            }),
    }));
