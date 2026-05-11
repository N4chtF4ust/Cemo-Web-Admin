import { useState, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Leaf01Icon } from "@hugeicons/core-free-icons";

interface Leaf {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface LeafCursorProps {
  active?: boolean;
}

export function LeafCursor({ active = true }: LeafCursorProps) {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const nextLeafId = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!active) return;

      const dist = Math.hypot(e.clientX - lastPos.current.x, e.clientY - lastPos.current.y);
      if (dist < 45) return;

      lastPos.current = { x: e.clientX, y: e.clientY };

      const count = 3 + Math.floor(Math.random() * 2);
      const newLeaves: Leaf[] = [];

      for (let i = 0; i < count; i++) {
        const id = nextLeafId.current++;
        const newLeaf: Leaf = {
          id,
          x: e.clientX,
          y: e.clientY,
          rotation: Math.random() * 360,
          scale: 0.6 + Math.random() * 0.9,
          offsetX: (Math.random() - 0.5) * 100,
          offsetY: (Math.random() - 0.5) * 100,
        };
        newLeaves.push(newLeaf);

        setTimeout(() => {
          setLeaves(prev => prev.filter(l => l.id !== id));
        }, 800);
      }

      setLeaves(prev => [...prev.slice(-40), ...newLeaves]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {leaves.map(leaf => (
        <div
          key={leaf.id}
          className="absolute text-cemo-primary/40 transition-all duration-1000 ease-out"
          style={{
            left: leaf.x,
            top: leaf.y,
            transform: `translate(calc(-50% + ${leaf.offsetX}px), calc(-50% + ${leaf.offsetY}px)) rotate(${leaf.rotation}deg) scale(${leaf.scale})`,
          }}
        >
          <HugeiconsIcon 
            icon={Leaf01Icon} 
            className="size-8 animate-out fade-out zoom-out-50 duration-700 ease-in-out fill-mode-forwards" 
          />
        </div>
      ))}
    </div>
  );
}
