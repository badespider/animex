export async function getGsap(): Promise<null | typeof import("gsap").gsap> {
  if (typeof window === "undefined") return null;
  const { gsap } = await import("gsap");
  return gsap as typeof import("gsap").gsap;
}

import { useEffect, useRef } from "react";

export function useGsapContext(setup: (gsap: typeof import("gsap").gsap, el: HTMLElement) => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const gsap = await getGsap();
      if (!gsap || !mounted || !ref.current) return;
      setup(gsap, ref.current);
    })();
    return () => {
      mounted = false;
    };
  }, [setup]);
  return ref;
}
