"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/frontend/lib/utils";

const AvatarContext = React.createContext(null);

const Avatar = React.forwardRef(({ className, children, ...props }, ref) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
});

Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef(
  ({ className, onLoad, onError, ...props }, ref) => {
    const context = React.useContext(AvatarContext);

    React.useEffect(() => {
      context?.setImageLoaded(false);
    }, [context?.setImageLoaded, props.src]);

    if (!props.src) return null;

    return (
      <Image
        ref={ref}
        fill
        sizes="40px"
        unoptimized
        className={cn("object-cover", className)}
        onLoad={(event) => {
          context?.setImageLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          context?.setImageLoaded(false);
          onError?.(event);
        }}
        {...props}
      />
    );
  },
);

AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AvatarContext);

    if (context?.imageLoaded) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
