import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

// Shared hover + click behavior for room props. Pass `onClick` to make
// a prop interactive; leave it out and the prop is pure decoration.
export default function Hoverable({ children, onClick, hoverScale = 1.03, ...groupProps }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const interactive = Boolean(onClick);

  useFrame(() => {
    if (!ref.current) return;
    const t = interactive && hovered ? hoverScale : 1;
    ref.current.scale.lerp({ x: t, y: t, z: t }, 0.12);
  });

  if (!interactive) return <group {...groupProps}>{children}</group>;

  return (
    <group
      ref={ref}
      {...groupProps}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </group>
  );
}