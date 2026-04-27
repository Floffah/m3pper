export interface BaseNode {
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

export interface BoxNode extends BaseNode {
    type: "box";
    width: number;
    height: number;
    depth: number;
}

export interface SphereNode extends BaseNode {
    type: "sphere";
    radius: number;
}

export interface GroupNode extends BaseNode {
    type: "group";
}

export interface RootNode extends Omit<GroupNode, "parentId"> {
    id: "root";
}

export type Node = BoxNode | SphereNode | GroupNode;
export type NodeTransform = BaseNode["transform"];
export type MapNode = Node | RootNode;
export type FlattenedMapNode = {
    id: string;
    node: MapNode;
    treeDepth: number;
};
