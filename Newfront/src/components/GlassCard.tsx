import { useRef, MouseEvent, ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark" | "green";
  interactive?: boolean;
}

export default function GlassCard({ 
  children, 
  className = "", 
  variant = "light",
  interactive = true 
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current || !specularRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add highlight effect
    specularRef.current.style.background = `radial-gradient(
      circle at ${x}px ${y}px,
      rgba(255,255,255,0.2) 0%,
      rgba(255,255,255,0.08) 30%,
      rgba(255,255,255,0) 60%
    )`;
  };

  const handleMouseLeave = () => {
    if (!interactive || !specularRef.current) return;
    specularRef.current.style.background = "none";
  };

  const variantClass = `glass-card-${variant}`;

  return (
    <div
      ref={cardRef}
      className={`glass-card ${variantClass} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="glass-filter" />
      <div className="glass-distortion-overlay" />
      <div className="glass-overlay" />
      <div ref={specularRef} className="glass-specular" />
      <div className="glass-content">
        {children}
      </div>
    </div>
  );
}