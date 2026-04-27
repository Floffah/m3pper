"use client";

import { Edges, PivotControls } from "@react-three/drei";
import { useMemo, useState } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { useShallow } from "zustand/react/shallow";

import { useEditor } from "@/components/providers/EditorProvider";
import { useMap } from "@/components/providers/MapProvider";

function matrixToTransform(matrix: Matrix4) {
    const matrixPosition = new Vector3();
    const matrixQuaternion = new Quaternion();
    const matrixRotation = new Euler();
    const matrixScale = new Vector3();

    matrix.decompose(matrixPosition, matrixQuaternion, matrixScale);
    matrixRotation.setFromQuaternion(matrixQuaternion);

    return {
        position: [matrixPosition.x, matrixPosition.y, matrixPosition.z] as [
            number,
            number,
            number,
        ],
        rotation: [matrixRotation.x, matrixRotation.y, matrixRotation.z] as [
            number,
            number,
            number,
        ],
        scale: [matrixScale.x, matrixScale.y, matrixScale.z] as [
            number,
            number,
            number,
        ],
    };
}

export function MapNode({ id }: { id: string }) {
    const node = useMap(useShallow((state) => state.nodes[id]));
    const updateNode = useMap(useShallow((state) => state.updateNode));

    const editor = useEditor();

    const [isHovered, setIsHovered] = useState(false);
    const isSelected = editor.selectedNodeIds.includes(id);

    const matrix = useMemo(() => {
        if (!node) return new Matrix4();

        return new Matrix4().compose(
            new Vector3(...node.transform.position),
            new Quaternion().setFromEuler(
                new Euler(...node.transform.rotation),
            ),
            new Vector3(...node.transform.scale),
        );
    }, [node]);

    if (!node) return null;

    if (node.type === "box") {
        return (
            <PivotControls
                enabled={isSelected}
                autoTransform={false}
                disableScaling
                matrix={matrix}
                scale={1.1}
                onDrag={(localMatrix) => {
                    updateNode(id, {
                        ...node,
                        transform: {
                            ...node.transform,
                            ...matrixToTransform(localMatrix),
                        },
                    });
                }}
            >
                <mesh
                    onPointerOver={(e) => {
                        e.stopPropagation();
                        setIsHovered(true);
                    }}
                    onPointerOut={(e) => {
                        e.stopPropagation();
                        setIsHovered(false);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();

                        if (!e.metaKey && !e.ctrlKey) {
                            editor.clearSelection();
                        }

                        editor.selectNode(id);
                    }}
                    onContextMenu={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.preventDefault();

                        if (!editor.selectedNodeIds.includes(id)) {
                            editor.clearSelection();
                            editor.selectNode(id);
                        }

                        editor.openContextMenu(
                            e.nativeEvent.clientX,
                            e.nativeEvent.clientY,
                        );
                    }}
                >
                    <boxGeometry args={[node.width, node.height, node.depth]} />
                    <meshStandardMaterial
                        color={node.material?.color ?? "white"}
                    />
                    <Edges
                        visible={isSelected}
                        color="#f59e0b"
                        lineWidth={3}
                        transparent
                        opacity={0.9}
                    />
                    <Edges
                        visible={isHovered && !isSelected}
                        color="#60a5fa"
                        lineWidth={1.5}
                        transparent
                        opacity={0.45}
                    />
                </mesh>
                {node.childrenIds.map((childId) => (
                    <MapNode key={childId} id={childId} />
                ))}
            </PivotControls>
        );
    }

    if (node.type === "group") {
        return (
            <group
                position={node.transform.position}
                rotation={node.transform.rotation}
                scale={node.transform.scale}
            >
                {node.childrenIds.map((childId) => (
                    <MapNode key={childId} id={childId} />
                ))}
            </group>
        );
    }

    return null;
}
