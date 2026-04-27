import { nanoid } from "nanoid";
import { Matrix4 } from "three";
import { create } from "zustand/react";

import {
    defaultInitState,
    getNodeWorldMatrix,
    isDescendantNode,
    matrixToNodeTransform,
} from "@/lib/map";
import type { BaseNode, MapNode, Node } from "@/lib/map";

type OptimisticNode = Omit<Node, keyof BaseNode> &
    Pick<Node, "type"> &
    Partial<BaseNode>;

export interface MapState {
    rootId: string;
    nodes: Record<string, MapNode>;
}

export interface MapActions {
    addNode: (node: OptimisticNode, parentId?: Node["parentId"]) => Node;
    moveNode: (
        nodeId: string,
        targetParentId: string,
        targetIndex: number,
    ) => void;
    updateNode: (nodeId: string, node: Node) => void;
    groupSelectedNodes: (nodeIds: string[]) => void;
    deleteNodes: (ids: string[]) => void;
}

export type MapStore = MapState & MapActions;

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
                const oldNodeIndex = oldParent.childrenIds.indexOf(nodeId);
                if (oldNodeIndex === -1) return state;

                const targetParentChildren =
                    oldParent.id === targetParent.id
                        ? oldParentChildren
                        : targetParent.childrenIds.filter(
                              (id) => id !== nodeId,
                          );
                const nextTargetParentChildren = [...targetParentChildren];
                const targetIndexAfterRemoval =
                    oldParent.id === targetParent.id &&
                    oldNodeIndex < targetIndex
                        ? targetIndex - 1
                        : targetIndex;
                const nextTargetIndex = Math.max(
                    0,
                    Math.min(
                        targetIndexAfterRemoval,
                        nextTargetParentChildren.length,
                    ),
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

        deleteNodes: (ids) =>
            set((state) => {
                const newNodes = { ...state.nodes };
                const parentUpdates: Record<
                    string,
                    { id: string; childrenIds: string[] }
                > = {};

                ids.forEach((nodeId) => {
                    const node = state.nodes[nodeId];
                    if (!node || !("parentId" in node)) return;

                    const parent = state.nodes[node.parentId];
                    if (!parent) return;

                    delete newNodes[nodeId];

                    if (!parentUpdates[parent.id]) {
                        parentUpdates[parent.id] = {
                            id: parent.id,
                            childrenIds: parent.childrenIds,
                        };
                    }

                    parentUpdates[parent.id].childrenIds = parentUpdates[
                        parent.id
                    ].childrenIds.filter((id) => id !== nodeId);
                });

                return {
                    nodes: {
                        ...newNodes,
                        ...Object.values(parentUpdates).reduce(
                            (acc, { id, childrenIds }) => ({
                                ...acc,
                                [id]: {
                                    ...newNodes[id],
                                    childrenIds,
                                },
                            }),
                            {},
                        ),
                    },
                };
            }),
    }));
