"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, FXAA } from "@react-three/postprocessing";
import Link from "next/link";
import { useShallow } from "zustand/react/shallow";

import EditorSidebar from "@/components/blocks/editor/EditorSidebar";
import { MapNode } from "@/components/blocks/editor/MapNode";
import { useEditor } from "@/components/providers/EditorProvider";
import { useMap } from "@/components/providers/MapProvider";
import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarMenu,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
} from "@/components/ui/menubar";

export default function Editor() {
    const rootId = useMap(useShallow((state) => state.rootId));
    const clearSelection = useEditor((state) => state.clearSelection);

    return (
        <div className="relative flex flex-1">
            <EditorSidebar>
                <div className="pointer-events-none absolute inset-0 z-20 flex h-full w-full flex-col px-4 py-2">
                    <Menubar className="pointer-events-auto bg-background">
                        <MenubarMenu>
                            <MenubarTrigger>File</MenubarTrigger>
                            <MenubarContent>
                                <MenubarGroup>
                                    <MenubarItem asChild>
                                        <Link href="/new">New Project</Link>
                                    </MenubarItem>
                                </MenubarGroup>
                                <MenubarSeparator />
                                <MenubarGroup>
                                    <MenubarItem>Download</MenubarItem>
                                    <MenubarSub>
                                        <MenubarSubTrigger>
                                            Export As
                                        </MenubarSubTrigger>
                                        <MenubarSubContent>
                                            <MenubarItem>GLTF</MenubarItem>
                                            <MenubarItem>PNG</MenubarItem>
                                        </MenubarSubContent>
                                    </MenubarSub>
                                </MenubarGroup>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Edit</MenubarTrigger>
                            <MenubarContent>
                                <MenubarGroup>
                                    <MenubarItem>Undo</MenubarItem>
                                    <MenubarItem>Redo</MenubarItem>
                                </MenubarGroup>
                                <MenubarSeparator />
                                <MenubarGroup>
                                    <MenubarCheckboxItem>
                                        Snap to Grid
                                    </MenubarCheckboxItem>
                                </MenubarGroup>
                                <MenubarSeparator />
                                <MenubarGroup>
                                    <MenubarRadioGroup>
                                        <MenubarRadioItem value="solid">
                                            Solid mode
                                        </MenubarRadioItem>
                                        <MenubarRadioItem value="wireframe">
                                            Wireframe mode
                                        </MenubarRadioItem>
                                    </MenubarRadioGroup>
                                </MenubarGroup>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                </div>

                <Canvas
                    dpr={[1, 2]}
                    camera={{
                        position: [5, 5, 5],
                        fov: 50,
                        near: 0.1,
                        far: 1000,
                    }}
                    className="z-10 h-full w-full flex-1"
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
            </EditorSidebar>
        </div>
    );
}
