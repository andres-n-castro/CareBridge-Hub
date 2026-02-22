import * as React from "react";

import { cn } from "./utils";

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "vertical" | "horizontal";
}) {
  // Native scrollbar — no custom rendering needed
  return null;
}

export { ScrollArea, ScrollBar };
