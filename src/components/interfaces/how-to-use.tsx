import { stores } from "@/stores";
import { MAP_STYLES } from "@/constants";
import { ComponentType, lazy, Suspense } from "react";

const HowToUseMdx = lazy(() => import("./how-to-use.mdx")) as ComponentType<{
  styles: string;
}>;

export const HowToUse = () => {
  const active = stores((s) => s.active);

  const idx = active.split("-").map((i) => Number(i));

  const activeStyles = MAP_STYLES[idx[0]].styles[idx[1]].styles;

  return (
    <Suspense>
      <HowToUseMdx styles={activeStyles} />
    </Suspense>
  );
};
