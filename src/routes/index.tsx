import { createFileRoute } from "@tanstack/react-router";
import { StyleUseWidgetWrapper } from "@/components/interfaces/style-use/wrapper";

export const Route = createFileRoute("/")({
  component: StyleUseWidgetWrapper,
});
