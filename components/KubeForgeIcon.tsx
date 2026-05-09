import { SVGProps } from "react";

export function KubeForgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <polygon
        points="16,8 22,11.5 22,18.5 16,22 10,18.5 10,11.5"
        fill="currentColor"
        opacity="0.4"
      />
      <circle cx="16" cy="15" r="3" fill="currentColor" />
    </svg>
  );
}
