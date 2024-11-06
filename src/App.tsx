import "maplibre-gl/dist/maplibre-gl.css";

import MapLibre from "react-map-gl/maplibre";

const App = () => {
  return (
    <div className="absolute h-svh w-full">
      <MapLibre
        attributionControl={false}
        mapStyle="https://maps.datawan.id/styles/black.json"
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
