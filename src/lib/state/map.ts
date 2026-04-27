import { nanoid } from "nanoid";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
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
export type NodeTransform = BaseNode["transform"];
export type MapNode = Node | RootNode;
export type FlattenedMapNode = {
    id: string;
    node: MapNode;
    treeDepth: number;
};

type OptimisticNode = Omit<Node, keyof BaseNode> &
    Pick<Node, "type"> &
    Partial<BaseNode>;

interface MapState {
    rootId: string;
    nodes: Record<string, MapNode>;
}

interface MapActions {
    addNode: (node: OptimisticNode) => Node;
    moveNode: (
        nodeId: string,
        targetParentId: string,
        targetIndex: number,
    ) => void;
    updateNode: (nodeId: string, node: Node) => void;
    groupSelectedNodes: (nodeIds: string[]) => void;
    deleteNode: (nodeId: string) => void;
}

export type MapStore = MapState & MapActions;

export function nodeTransformToMatrix(transform: NodeTransform) {
    return new Matrix4().compose(
        new Vector3(...transform.position),
        new Quaternion().setFromEuler(new Euler(...transform.rotation)),
        new Vector3(...transform.scale),
    );
}

export function matrixToNodeTransform(matrix: Matrix4): NodeTransform {
    const position = new Vector3();
    const quaternion = new Quaternion();
    const rotation = new Euler();
    const scale = new Vector3();

    matrix.decompose(position, quaternion, scale);
    rotation.setFromQuaternion(quaternion);

    return {
        position: [position.x, position.y, position.z],
        rotation: [rotation.x, rotation.y, rotation.z],
        scale: [scale.x, scale.y, scale.z],
    };
}

export function getNodeWorldMatrix(
    nodes: Record<string, MapNode>,
    nodeId: string,
) {
    const path: MapNode[] = [];
    const visitedNodeIds = new Set<string>();
    let currentNode = nodes[nodeId];

    while (currentNode && !visitedNodeIds.has(currentNode.id)) {
        visitedNodeIds.add(currentNode.id);
        path.unshift(currentNode);

        if (!("parentId" in currentNode)) break;

        currentNode = nodes[currentNode.parentId];
    }

    return path.reduce(
        (matrix, node) =>
            matrix.multiply(nodeTransformToMatrix(node.transform)),
        new Matrix4(),
    );
}

export function flattenMapNodes(
    nodes: Record<string, MapNode>,
    nodeId: string,
): FlattenedMapNode[] {
    const node = nodes[nodeId];
    if (!node) return [];

    const flattenChild = (
        childId: string,
        treeDepth: number,
    ): FlattenedMapNode[] => {
        const childNode = nodes[childId];
        if (!childNode) return [];

        return [
            { id: childId, node: childNode, treeDepth },
            ...childNode.childrenIds.flatMap((grandchildId) =>
                flattenChild(grandchildId, treeDepth + 1),
            ),
        ];
    };

    return node.childrenIds.flatMap((childId) => flattenChild(childId, 0));
}

export function isDescendantNode(
    nodes: Record<string, MapNode>,
    possibleDescendantId: string,
    ancestorId: string,
): boolean {
    const ancestor = nodes[ancestorId];
    if (!ancestor) return false;

    return ancestor.childrenIds.some(
        (childId) =>
            childId === possibleDescendantId ||
            isDescendantNode(nodes, possibleDescendantId, childId),
    );
}

export const defaultInitState: MapState = {
    rootId: "root",
    nodes: {
        root: {
            id: "root",
            type: "group",
            childrenIds: ["group-1", "group-2"],
            transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
        },
        "group-1": {
            id: "group-1",
            type: "group",
            parentId: "root",
            childrenIds: ["box-1"],
            transform: {
                position: [0, 0.5, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
        },
        "box-1": {
            id: "box-1",
            type: "box",
            parentId: "group-1",
            childrenIds: [],
            transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
            width: 1,
            height: 1,
            depth: 4,
        },
        "group-2": {
            id: "group-2",
            type: "group",
            parentId: "root",
            childrenIds: ["box-2"],
            transform: {
                position: [0, 0.5, 2.5],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
        },
        "box-2": {
            id: "box-2",
            type: "box",
            parentId: "group-2",
            childrenIds: [],
            transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
            },
            width: 1.5,
            height: 1.5,
            depth: 1.5,
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

        moveNode: (nodeId, targetParentId, targetIndex) =>
            set((state) => {
                if (nodeId === state.rootId) return state;

                const node = state.nodes[nodeId];
                const targetParent = state.nodes[targetParentId];

                if (
                    !node ||
                    !targetParent ||
                    !("parentId" in node) ||
                    targetParent.type !== "group" ||
                    nodeId === targetParentId ||
                    isDescendantNode(state.nodes, targetParentId, nodeId)
                ) {
                    return state;
                }

                const oldParent = state.nodes[node.parentId];
                if (!oldParent) return state;

                const nextTransform =
                    oldParent.id === targetParent.id
                        ? node.transform
                        : matrixToNodeTransform(
                              new Matrix4()
                                  .copy(
                                      getNodeWorldMatrix(
                                          state.nodes,
                                          targetParentId,
                                      ),
                                  )
                                  .invert()
                                  .multiply(
                                      getNodeWorldMatrix(state.nodes, nodeId),
                                  ),
                          );

                const oldParentChildren = oldParent.childrenIds.filter(
                    (id) => id !== nodeId,
                );
                const targetParentChildren =
                    oldParent.id === targetParent.id
                        ? oldParentChildren
                        : targetParent.childrenIds.filter(
                              (id) => id !== nodeId,
                          );
                const nextTargetParentChildren = [...targetParentChildren];
                const nextTargetIndex = Math.max(
                    0,
                    Math.min(targetIndex, nextTargetParentChildren.length),
                );

                nextTargetParentChildren.splice(nextTargetIndex, 0, nodeId);

                return {
                    nodes: {
                        ...state.nodes,
                        [nodeId]: {
                            ...node,
                            parentId: targetParentId,
                            transform: nextTransform,
                        },
                        ...(oldParent.id === targetParent.id
                            ? {
                                  [oldParent.id]: {
                                      ...oldParent,
                                      childrenIds: nextTargetParentChildren,
                                  },
                              }
                            : {
                                  [oldParent.id]: {
                                      ...oldParent,
                                      childrenIds: oldParentChildren,
                                  },
                                  [targetParent.id]: {
                                      ...targetParent,
                                      childrenIds: nextTargetParentChildren,
                                  },
                              }),
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
