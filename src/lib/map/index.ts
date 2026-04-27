import { Euler, Matrix4, Quaternion, Vector3 } from "three";

import type { FlattenedMapNode, MapNode, NodeTransform } from "@/lib/map/types";

export type {
    BaseNode,
    BoxNode,
    FlattenedMapNode,
    GroupNode,
    MapNode,
    Node,
    NodeTransform,
    RootNode,
    SphereNode,
} from "@/lib/map/types";

type InitialMapState = {
    rootId: string;
    nodes: Record<string, MapNode>;
};

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

export const defaultInitState: InitialMapState = {
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
