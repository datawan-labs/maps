import { MAP_STYLES } from "./constants";
import { MapInstance, MapProvider } from "./components/ui/maps";
import { WidgetDesktop, WidgetMobile } from "./components/interfaces/widget";

const App = () => {
  return (
    <div className="absolute h-svh w-full" vaul-drawer-wrapper="">
      <MapProvider>
        <WidgetDesktop />
        <WidgetMobile />
        <MapInstance
          antialias={true}
          mapStyle={MAP_STYLES[1].styles[4].styles}
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
    </div>
  );
};

export default App;
