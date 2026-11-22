"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { formatCount } from "@/lib/model-utils";

export default function AnimatedCounter({ value }) {
  const ref = useRef(null);
  const numericValue = Number(value) || 0;

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: numericValue,
      duration: 0.85,
      ease: "power2.out",
      onUpdate: () => {
        if (node) node.textContent = formatCount(Math.round(counter.value));
      },
    });
    return () => tween.kill();
  }, [numericValue]);

  return <span ref={ref}>{formatCount(numericValue)}</span>;
}
