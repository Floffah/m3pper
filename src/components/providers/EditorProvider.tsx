"use client";

import { PropsWithChildren, createContext, useContext, useMemo } from "react";

import EditorContextMenu from "@/components/blocks/editor/EditorContextMenu";
import { createUseEditor } from "@/lib/state/editor";

const EditorContext = createContext<ReturnType<typeof createUseEditor>>(null!);

export default function EditorProvider({ children }: PropsWithChildren) {
    const useEditor = useMemo(() => createUseEditor(), []);

    return (
        <EditorContext.Provider value={useEditor}>
            {children}

            <EditorContextMenu />
        </EditorContext.Provider>
    );
}

export const useEditor = ((selector) => {
    const useEditor = useContext(EditorContext);

    if (!useEditor) {
        throw new Error("useEditor must be used within an EditorProvider");
    }

    return useEditor(selector);
}) as ReturnType<typeof createUseEditor>;
