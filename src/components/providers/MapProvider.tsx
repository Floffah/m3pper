"use client";

import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { UseBoundStore } from "zustand/react";
import { StoreApi } from "zustand/vanilla";

import { type MapStore, createUseMap } from "@/lib/state/map";

const MapContext = createContext<ReturnType<typeof createUseMap>>(null!);

export default function MapProvider({ children }: PropsWithChildren) {
    const useMap = useMemo(() => createUseMap(), []);

    return <MapContext.Provider value={useMap}>{children}</MapContext.Provider>;
}

export const useMap = ((selector) => {
    const useMap = useContext(MapContext);

    if (!useMap) {
        throw new Error("useMap must be used within a MapProvider");
    }

    return useMap(selector);
}) as UseBoundStore<StoreApi<MapStore>>;
