import "maplibre-gl/dist/maplibre-gl.css";

import MapLibre from "react-map-gl/maplibre";

const App = () => {
  return (
    <div className="absolute h-svh w-full">
      <MapLibre
        antialias={true}
        attributionControl={false}
        mapStyle="https://maps.datawan.id/styles/light-3d.json"
        initialViewState={{
          zoom: 16,
          pitch: 60,
          bearing: 14,
          latitude: -6.207102,
          longitude: 106.822657,
        }}
        style={{
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      ></MapLibre>
    </div>
  );
};

export default App;
