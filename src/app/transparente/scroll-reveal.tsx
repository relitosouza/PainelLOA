"use client";

import { useEffect } from "react";

/** Revela os elementos .animate-in-target conforme entram na viewport. */
export function ScrollReveal() {
  useEffect(() => {
    const alvos = document.querySelectorAll(".animate-in-target");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-in");
        });
      },
      { threshold: 0.1 }
    );
    alvos.forEach((alvo) => observer.observe(alvo));
    return () => observer.disconnect();
  }, []);

  return null;
}
