"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, FXAA } from "@react-three/postprocessing";
import { useShallow } from "zustand/react/shallow";

import { MapNode } from "@/components/blocks/editor/MapNode";
import { useEditor } from "@/components/providers/EditorProvider";
import { useMap } from "@/components/providers/MapProvider";

export default function Editor() {
    const rootId = useMap(useShallow((state) => state.rootId));
    const clearSelection = useEditor((state) => state.clearSelection);

    return (
        <div className="relative flex flex-1">
            <Canvas
                dpr={[1, 2]}
                camera={{
                    position: [5, 5, 5],
                    fov: 50,
                    near: 0.1,
                    far: 1000,
                }}
                className="h-full w-full flex-1"
                onPointerMissed={() => {
                    clearSelection();
                }}
            >
                <ambientLight args={[0x404040]} />
                <Grid
                    position={[0, -0.01, 0]}
                    args={[100.5, 100.5]}
                    sectionColor={0x888888}
                />
                <OrbitControls
                    enableDamping
                    enablePan={false}
                    enableZoom
                    makeDefault
                    zoomSpeed={1}
                    target={[0, 0, 0]}
                />

                <MapNode id={rootId} />

                <EffectComposer>
                    <FXAA />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
