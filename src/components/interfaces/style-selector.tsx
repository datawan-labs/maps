import { stores } from "@/stores";
import { MAP_STYLES } from "@/constants";
import { Label } from "@/components/ui/label";
import { useMap } from "@/components/ui/maps";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const StyleSelector = () => {
  const map = useMap();

  const active = stores((s) => s.active);

  const changeStyles = (index: string) => {
    if (!index) return;

    stores.getState().setActive(index);

    const idx = index.split("-").map((i) => Number(i));

    const selected = MAP_STYLES[idx[0]].styles[idx[1]];

    map?.setStyle(selected.styles);
  };

  return (
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={changeStyles}
      className="flex flex-col space-y-4"
    >
      {MAP_STYLES.map((i, id) => (
        <div key={id} className="w-full space-y-2">
          <div className="flex flex-col space-y-2">
            <Label className="font-bold">{i.name}</Label>
            <Label className="text-muted-foreground text-xs">
              {i.description}
            </Label>
          </div>
          <div className="grid grid-cols-4 items-start gap-2">
            {i.styles.map((s, idx) => (
              <ToggleGroupItem
                key={[id, idx].join("-")}
                value={[id, idx].join("-")}
                className="block h-auto w-full space-y-2 px-0"
              >
                <img
                  alt={s.name}
                  src={s.image}
                  className="aspect-square w-full rounded-md"
                />
                <div className="text-center text-xs">{s.name}</div>
              </ToggleGroupItem>
            ))}
          </div>
        </div>
      ))}
    </ToggleGroup>
  );
};
