import React, { AnchorHTMLAttributes } from "react";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <a
      className={`text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-sm transition-all ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </a>
  );
};
