import dark from "@/assets/dark.png";
import black from "@/assets/black.png";
import light from "@/assets/light.png";
import white from "@/assets/white.png";
import light3d from "@/assets/light-3d.png";
import grayscale from "@/assets/grayscale.png";

export type MapStyle = {
  name: string;
  image: string;
  styles: string;
};

export type MapStyleGroup = {
  name: string;
  description: string;
  styles: MapStyle[];
};

export const MAP_STYLES: MapStyleGroup[] = [
  {
    name: "Basic",
    description: "Maps for general usecase",
    styles: [
      {
        name: "Dark",
        image: dark,
        styles: "https://maps.datawan.id/styles/dark.json",
      },
      {
        name: "Grayscale",
        image: grayscale,
        styles: "https://maps.datawan.id/styles/grayscale.json",
      },
      {
        name: "Black",
        image: black,
        styles: "https://maps.datawan.id/styles/black.json",
      },
      {
        name: "White",
        image: white,
        styles: "https://maps.datawan.id/styles/white.json",
      },
      {
        name: "Light",
        image: light,
        styles: "https://maps.datawan.id/styles/light.json",
      },
    ],
  },
  {
    name: "No Label",
    description: "Maps without labels, ideal for clear and minimalistic views",
    styles: [
      {
        name: "Dark",
        image: dark,
        styles: "https://maps.datawan.id/styles/dark-no-label.json",
      },
      {
        name: "Grayscale",
        image: grayscale,
        styles: "https://maps.datawan.id/styles/grayscale-no-label.json",
      },
      {
        name: "Black",
        image: black,
        styles: "https://maps.datawan.id/styles/black-no-label.json",
      },
      {
        name: "White",
        image: white,
        styles: "https://maps.datawan.id/styles/white-no-label.json",
      },

      {
        name: "Light",
        image: light,
        styles: "https://maps.datawan.id/styles/light-no-label.json",
      },
    ],
  },
  {
    name: "3 Dimensional",
    description: "With 3D map elements, such as buildings and monuments",
    styles: [
      {
        name: "Light 3D",
        image: light3d,
        styles: "https://maps.datawan.id/styles/light-3d.json",
      },
    ],
  },
];
