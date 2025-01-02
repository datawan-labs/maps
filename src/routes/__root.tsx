import "@/styles/globals.css";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/plus-jakarta-sans";

import { MAP_STYLES } from "@/constants";
import { MapInstance, MapProvider } from "@/components/ui/maps";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <main className="absolute h-svh w-full" vaul-drawer-wrapper="">
      <MapProvider>
        <Outlet />
        <MapInstance
          mapStyle={MAP_STYLES[1].styles[4].styles}
          canvasContextAttributes={{ antialias: true }}
          mapView={{ zoom: 12, center: [106.822657, -6.207102] }}
          style={{
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            position: "absolute",
          }}
        />
      </MapProvider>
    </main>
  ),
});
