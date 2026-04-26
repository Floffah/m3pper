import { PropsWithChildren } from "react";

import EditorProvider from "@/components/providers/EditorProvider";
import MapProvider from "@/components/providers/MapProvider";

export default function Layout({ children }: PropsWithChildren) {
    return (
        <MapProvider>
            <EditorProvider>{children}</EditorProvider>
        </MapProvider>
    );
}
