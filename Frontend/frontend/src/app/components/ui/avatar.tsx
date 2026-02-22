import * as React from "react";

import { cn } from "./utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  alt,
  onLoadingStatusChange,
  ...props
}: React.ComponentProps<"img"> & {
  onLoadingStatusChange?: (status: "loading" | "loaded" | "error") => void;
}) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );

  React.useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setStatus("loaded");
      onLoadingStatusChange?.("loaded");
    };
    img.onerror = () => {
      setStatus("error");
      onLoadingStatusChange?.("error");
    };
  }, [src]);

  if (status !== "loaded") return null;

  return (
    <img
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      src={src}
      alt={alt}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
