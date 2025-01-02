import { stores } from "@/stores";
import { MAP_STYLES } from "@/constants";
import { Button } from "@/components/ui/button";
import { IconCopy, IconCopyCheckFilled } from "@tabler/icons-react";
import { useCopyToClipboard } from "@/components/hooks/use-copy-to-clipboard";

export const CopyStyles = () => {
  const active = stores((s) => s.active);

  const [copiedText, copyToClipboard] = useCopyToClipboard();

  const idx = active.split("-").map((i) => Number(i));

  const activeStyles = MAP_STYLES[idx[0]].styles[idx[1]].styles;

  const hasBeenCopied = activeStyles === copiedText;

  return (
    <code className="flex items-center justify-between rounded-md border bg-accent">
      <div className="flex-1 p-2">
        <span className="line-clamp-1 font-mono text-xs">{activeStyles}</span>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="size-7 hover:bg-popover"
        onClick={() => copyToClipboard(activeStyles)}
      >
        {!hasBeenCopied && <IconCopy className="size-4" />}
        {hasBeenCopied && <IconCopyCheckFilled className="size-4" />}
      </Button>
    </code>
  );
};
