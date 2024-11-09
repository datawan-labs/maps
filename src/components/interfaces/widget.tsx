import { HowToUse } from "./how-to-use";
import { CopyStyles } from "./copy-styles";
import { Button } from "@/components/ui/button";
import { StyleSelector } from "./style-selector";
import { IconBrandGithub, IconMapCode } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerNested,
  DrawerTrigger,
} from "@/components/ui/drawer";

export const WidgetDesktop = () => {
  return (
    <div className="absolute right-0 left-0 z-10 hidden max-h-svh max-w-sm overflow-hidden p-4 md:flex">
      <Card className="flex w-full flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Change Styles</CardTitle>
          <Button variant="ghost" size="icon" className="size-6" asChild>
            <a href="http://github.com/datawan-labs/maps" target="_blank">
              <IconBrandGithub className="size-4" />
            </a>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden px-0">
          <div className="mb-2 flex w-full flex-col space-y-2 border-accent border-b px-4 pb-2">
            <CopyStyles />
            <Dialog>
              <DialogTrigger className="text-left text-muted-foreground text-sm">
                <span>Click here to how to use this styles</span>
              </DialogTrigger>
              <DialogContent className="flex max-h-svh max-w-2xl flex-col px-0">
                <div className="prose w-full flex-1 overflow-y-auto overflow-x-hidden px-4">
                  <HowToUse />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-auto px-4">
            <StyleSelector />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const WidgetMobile = () => {
  return (
    <Drawer>
      <div className="absolute bottom-0 left-0 z-10 flex p-4 pb-4 md:hidden">
        <DrawerTrigger asChild className="size-10">
          <Button size="icon" className="rounded-full">
            <IconMapCode className="stroke-[1.5]" />
          </Button>
        </DrawerTrigger>
      </div>
      <DrawerContent className="flex max-h-svh flex-col">
        <div className="m-auto w-full max-w-xs flex-1 overflow-auto">
          <StyleSelector />
        </div>
        <DrawerFooter className="m-auto flex w-full max-w-xs flex-row px-0">
          <Button variant="outline" asChild className="w-full flex-1 space-x-2">
            <a href="http://github.com/datawan-labs/maps" target="_blank">
              <span className="text-xs">GitHub</span>
              <IconBrandGithub className="size-4" />
            </a>
          </Button>
          <DrawerNested>
            <DrawerTrigger asChild>
              <Button className="w-full flex-1 space-x-2">
                <span className="text-xs">Tutorial</span>
                <IconMapCode className="size-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="flex max-h-[calc(100svh-10%)] flex-col">
              <div className="prose m-auto w-full max-w-md flex-1 overflow-auto">
                <HowToUse />
              </div>
            </DrawerContent>
          </DrawerNested>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
