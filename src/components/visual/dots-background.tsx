"use client";
import { useEffect, useRef } from "react";

export type DotsBackgroundProps = {
  density?: number; // dots per 10k px^2
  speed?: number; // base speed in px/sec
  interactionRadius?: number; // px
  color?: string; // canvas strokeStyle
  className?: string;
  opacity?: number; // 0-1
};

export const DotsBackground = ({
  density = 10,
  speed = 15,
  interactionRadius = 80,
  color = "rgba(255,255,255,0.5)",
  className = "",
  opacity = 1,
}: DotsBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    type Dot = { x: number; y: number; vx: number; vy: number; r: number };
    let dots: Dot[] = [];

    const createDots = () => {
      dots = [];
      const area = (width * height) / 10000; // 10k px^2 blocks
      const count = Math.max(24, Math.floor(area * density));
      for (let i = 0; i < count; i++) {
        const r = Math.random() * 1.2 + 0.4;
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r,
        });
      }
    };

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      createDots();
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = t.clientX - rect.left;
      mouseRef.current.y = t.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const handleLeave = () => {
      mouseRef.current.active = false;
    };

    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // clamp 50ms
      last = now;

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // subtle motion
        d.x += d.vx * dt * 0.2;
        d.y += d.vy * dt * 0.2;

        // wrap around
        if (d.x < -5) d.x = width + 5;
        if (d.x > width + 5) d.x = -5;
        if (d.y < -5) d.y = height + 5;
        if (d.y > height + 5) d.y = -5;

        // interaction (repel)
        if (mouseRef.current.active) {
          const dx = d.x - mouseRef.current.x;
          const dy = d.y - mouseRef.current.y;
          const dist2 = dx * dx + dy * dy;
          const rad = interactionRadius;
          if (dist2 < rad * rad) {
            const factor = (rad - Math.sqrt(dist2)) / rad;
            d.x += (dx / (Math.sqrt(dist2) + 0.0001)) * factor * 20 * dt;
            d.y += (dy / (Math.sqrt(dist2) + 0.0001)) * factor * 20 * dt;
          }
        }
      }

      // draw connections
      ctx.strokeStyle = color;
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          const max = 120;
          if (dist2 < max * max) {
            const alpha = 1 - Math.sqrt(dist2) / max;
            ctx.globalAlpha = alpha * 0.5 * opacity;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw points on top
      ctx.globalAlpha = opacity;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    // init
    createDots();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleLeave);
    canvas.addEventListener("touchstart", handleTouch, { passive: true });
    canvas.addEventListener("touchmove", handleTouch, { passive: true });
    canvas.addEventListener("touchend", handleLeave, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.removeEventListener("touchstart", handleTouch);
      canvas.removeEventListener("touchmove", handleTouch);
      canvas.removeEventListener("touchend", handleLeave);
    };
  }, [density, speed, interactionRadius, color, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={
        "pointer-events-auto absolute inset-0 h-full w-full [contain:strict]" + (className ? " " + className : "")
      }
      aria-hidden
    />
  );
};

export default DotsBackground;