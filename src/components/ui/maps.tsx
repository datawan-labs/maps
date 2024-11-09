import "maplibre-gl/dist/maplibre-gl.css";

import { cn } from "@/utils/classnames";
import maplibregl, {
  MapOptions,
  FlyToOptions,
  Map as MapLibre,
  ProjectionSpecification,
} from "maplibre-gl";
import {
  FC,
  useRef,
  useState,
  useEffect,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";

interface MapContextValue {
  map: MapLibre | undefined;

  setMap: (map: MapLibre) => void;
}

export type ViewOptions = Pick<
  FlyToOptions,
  "center" | "bearing" | "pitch" | "zoom"
>;

export type MapInstance = Omit<
  MapOptions,
  "style" | "container" | keyof ViewOptions
> & {
  /**
   * classNames for map instances components
   */
  className?: string;

  /**
   * additional style for map instance
   */
  style?: React.CSSProperties;

  /**
   * map style, see mapbox style spec
   */
  mapStyle?: MapOptions["style"];

  /**
   * handle map view
   */
  mapView?: ViewOptions;

  /**
   * map projection, currently globe and mercator
   */
  projection?: ProjectionSpecification["type"];
};

const MapContext = createContext<MapContextValue | undefined>(undefined);

/**
 * wherever you want to render maps, you need to initialize this first
 */
export const MapProvider: FC<PropsWithChildren> = ({ children }) => {
  const [map, setMap] = useState<MapLibre>();

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
};

/**
 * render maps intance inside provider
 */
export const MapInstance: FC<MapInstance> = ({
  style,
  mapView,
  mapStyle,
  className,
  projection,
  ...props
}) => {
  const ctx = useContext(MapContext);

  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewOptions: ViewOptions = mapView
      ? Object.entries(mapView).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) acc[key as keyof typeof acc] = value;

            return acc;
          },
          {} as Record<string, unknown>
        )
      : {};

    const map = new maplibregl.Map({
      style: mapStyle,
      container: mapContainer.current!,
      ...viewOptions,
      ...props,
    });

    if (projection)
      map.on("style.load", () => {
        map.setProjection({ type: projection });
      });

    ctx?.setMap(map);

    return () => map.remove();
  }, []);

  /**
   * update styles when projection changes
   */
  useEffect(() => {
    if (mapStyle) ctx?.map?.setStyle(mapStyle);
  }, [mapStyle]);

  /**
   * update projection when projection changes
   */
  useEffect(() => {
    if (projection) ctx?.map?.setProjection({ type: projection });
  }, [projection]);

  return (
    <div
      style={style}
      ref={mapContainer!}
      className={cn("absolute size-full", className)}
    />
  );
};

/**
 * use this to access map instance
 */
export const useMap = () => {
  const ctx = useContext(MapContext);

  if (!ctx) throw new Error("you do it wrong");

  return ctx.map!;
};
