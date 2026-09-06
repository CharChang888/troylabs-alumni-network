"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  depth: number;
  twinkle: number;
  sparkle: boolean;
};

function seedStars(count: number, sparkleEvery: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const depth = i % 3 === 0 ? 0.25 : i % 3 === 1 ? 0.55 : 1;
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: depth < 0.4 ? 0.5 + Math.random() * 0.5 : depth < 0.7 ? 0.8 + Math.random() * 0.8 : 1.2 + Math.random() * 1.4,
      a: 0.25 + Math.random() * 0.75,
      depth,
      twinkle: Math.random() * Math.PI * 2,
      sparkle: i % sparkleEvery === 0,
    });
  }
  return stars;
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.55, y - size * 0.55);
  ctx.lineTo(x + size * 0.55, y + size * 0.55);
  ctx.moveTo(x + size * 0.55, y - size * 0.55);
  ctx.lineTo(x - size * 0.55, y + size * 0.55);
  ctx.stroke();
  ctx.restore();
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    starsRef.current = seedStars(280, 16);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current = { x: nx, y: ny };
    };
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    const tick = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = reduceMotion.current ? 0 : mouseRef.current.x;
      const my = reduceMotion.current ? 0 : mouseRef.current.y;
      const sy = reduceMotion.current ? 0 : scrollRef.current;

      for (const star of starsRef.current) {
        const parallaxX = mx * 28 * star.depth;
        const parallaxY = my * 18 * star.depth + sy * 0.08 * star.depth;
        const x = ((star.x * w + parallaxX) % w + w) % w;
        const y = ((star.y * h + parallaxY) % h + h) % h;
        const tw = reduceMotion.current ? 1 : 0.65 + 0.35 * Math.sin(t * 0.0015 + star.twinkle);

        if (star.sparkle) {
          drawSparkle(ctx, x, y, 3 + star.r * 1.6, star.a * tw * 0.9);
        } else {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${star.a * tw})`;
          ctx.arc(x, y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
