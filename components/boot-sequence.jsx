"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const bootLines = [
  "MODELROUTERX INITIALIZING…",
  "CONNECTING AI DATA SOURCES…",
  "LOADING MODEL INDEX…",
  "SYNCING BENCHMARK DATABASE…",
  "SYSTEM ONLINE.",
];

export default function BootSequence() {
  const rootRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let alreadyComplete = false;
    try { alreadyComplete = sessionStorage.getItem("mrx-boot-complete") === "1"; } catch {}
    if (motionQuery.matches || alreadyComplete) return undefined;

    const stopForReducedMotion = (event) => {
      if (!event.matches) return;
      try { sessionStorage.setItem("mrx-boot-complete", "1"); } catch {}
      setVisible(false);
    };
    motionQuery.addEventListener("change", stopForReducedMotion);
    setVisible(true);

    return () => motionQuery.removeEventListener("change", stopForReducedMotion);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!visible || !root) return undefined;

    const finish = () => {
      try { sessionStorage.setItem("mrx-boot-complete", "1"); } catch {}
      setVisible(false);
    };
    const timeline = gsap.timeline({ onComplete: finish });
    timeline.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power1.out" });
    timeline.fromTo(root.querySelectorAll("[data-boot-line]"), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.14, stagger: 0.1, ease: "power2.out" }, 0.08);
    timeline.fromTo(root.querySelector("[data-boot-progress]"), { scaleX: 0 }, { scaleX: 1, duration: 0.58, ease: "power1.inOut" }, 0.12);
    timeline.to(root, { opacity: 0, duration: 0.18, ease: "power1.out" }, "+=0.12");

    return () => timeline.kill();
  }, [visible]);

  function skip() {
    try { sessionStorage.setItem("mrx-boot-complete", "1"); } catch {}
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }
    gsap.to(rootRef.current, { opacity: 0, duration: 0.12, onComplete: () => setVisible(false) });
  }

  if (!visible) return <div ref={rootRef} className="boot-screen boot-screen-hidden" aria-hidden="true" />;

  return (
    <div ref={rootRef} className="boot-screen" role="status" aria-label="Preparing ModelRouterX data interface">
      <section className="boot-console">
        <div className="boot-brand"><span className="boot-mark">X</span><span>MODELROUTER<span className="boot-brand-accent">X</span></span></div>
        <div className="boot-lines" aria-hidden="true">{bootLines.map((line) => <span data-boot-line key={line}>{line}</span>)}</div>
        <div className="boot-progress"><i data-boot-progress /></div>
        <div className="boot-status"><span><i /> SOURCE CACHE · 15 MIN</span><button type="button" onClick={skip}>SKIP <span className="sr-only">boot sequence</span></button></div>
      </section>
    </div>
  );
}
