import type { CSSProperties } from "react";

/** Inline CSS custom properties (e.g. `style={cssVars({ "--d": "0.5s" })}`). */
export const cssVars = (vars: Record<`--${string}`, string | number>): CSSProperties => vars as CSSProperties;
