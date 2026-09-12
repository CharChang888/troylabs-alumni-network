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

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  width: number;
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

function spawnShootingStar(w: number, h: number): ShootingStar {
  const fromTop = Math.random() > 0.35;
  const x = fromTop ? Math.random() * w * 0.85 : -40;
  const y = fromTop ? -20 : Math.random() * h * 0.45;
  const speed = 9 + Math.random() * 8;
  const angle = Math.PI / 5 + Math.random() * (Math.PI / 8); // ~36–58° down-right
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 42 + Math.floor(Math.random() * 28),
    length: 55 + Math.random() * 70,
    width: 1 + Math.random() * 1.2,
  };
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

function drawShootingStar(ctx: CanvasRenderingContext2D, s: ShootingStar) {
  const progress = s.life / s.maxLife;
  const fade = progress < 0.15 ? progress / 0.15 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
  const mag = Math.hypot(s.vx, s.vy) || 1;
  const tx = (s.vx / mag) * s.length;
  const ty = (s.vy / mag) * s.length;
  const x0 = s.x - tx;
  const y0 = s.y - ty;

  const gradient = ctx.createLinearGradient(x0, y0, s.x, s.y);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.55, `rgba(255,255,255,${0.35 * fade})`);
  gradient.addColorStop(1, `rgba(255,255,255,${0.95 * fade})`);

  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(s.x, s.y);
  ctx.stroke();

  ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 1.4 + s.width * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const nextShotAtRef = useRef(0);
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
    shootingRef.current = [];
    nextShotAtRef.current = performance.now() + 1800 + Math.random() * 2400;

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

      if (!reduceMotion.current) {
        if (t >= nextShotAtRef.current && shootingRef.current.length < 2) {
          shootingRef.current.push(spawnShootingStar(w, h));
          nextShotAtRef.current = t + 2800 + Math.random() * 5200;
        }

        shootingRef.current = shootingRef.current.filter((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.life += 1;
          drawShootingStar(ctx, s);
          return s.life < s.maxLife && s.x < w + 80 && s.y < h + 80;
        });
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
