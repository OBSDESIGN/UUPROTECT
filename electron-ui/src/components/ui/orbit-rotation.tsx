"use client"

import type React from "react"
import {
  FaApple,
  FaAws,
  FaDocker,
  FaGithub,
  FaGoogle,
  FaInstagram,
  FaLinkedin,
  FaNodeJs,
  FaReact,
  FaTwitter,
} from "react-icons/fa"
import {
  SiFacebook,
  SiNextdotjs,
  SiRedux,
  SiTypescript,
  SiVercel,
} from "react-icons/si"

import { cn } from "@/lib/utils"

interface OrbitIcon {
  Icon: React.ComponentType<{ className?: string }>
  name?: string
}

interface OrbitRotationProps {
  icons?: OrbitIcon[]
  orbitCount?: number
  orbitGap?: number
  centerIcon?: OrbitIcon
  centerContent?: React.ReactNode
  onCenterClick?: () => void
  centerDisabled?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

const defaultIcons: OrbitIcon[] = [
  { Icon: FaReact, name: "React" },
  { Icon: FaAws, name: "AWS" },
  { Icon: FaDocker, name: "Docker" },
  { Icon: FaNodeJs, name: "Node.js" },
  { Icon: SiNextdotjs, name: "Next.js" },
  { Icon: SiVercel, name: "Vercel" },
  { Icon: SiRedux, name: "Redux" },
  { Icon: SiTypescript, name: "TypeScript" },
  { Icon: FaGithub, name: "GitHub" },
  { Icon: FaTwitter, name: "Twitter" },
  { Icon: FaLinkedin, name: "LinkedIn" },
  { Icon: FaInstagram, name: "Instagram" },
  { Icon: FaGoogle, name: "Google" },
  { Icon: FaApple, name: "Apple" },
  { Icon: SiFacebook, name: "Facebook" },
]

const defaultCenterIcon: OrbitIcon = {
  Icon: FaReact,
  name: "React",
}

export function OrbitRotation({
  icons = defaultIcons,
  orbitCount = 3,
  orbitGap = 6,
  centerIcon = defaultCenterIcon,
  centerContent,
  onCenterClick,
  centerDisabled,
  className,
  size = "md",
  ...props
}: OrbitRotationProps) {
  const safeIcons = icons.length ? icons : defaultIcons
  const iconsPerOrbit = Math.max(1, Math.ceil(safeIcons.length / orbitCount))

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  const iconSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  const CenterTag = onCenterClick ? "button" : "div"

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Center Icon/Button */}
        <CenterTag
          type={onCenterClick ? "button" : undefined}
          onClick={onCenterClick}
          disabled={onCenterClick ? centerDisabled : undefined}
          className={cn(
            "bg-background/90 border-border/50 z-10 flex items-center justify-center rounded-full border shadow-xl backdrop-blur-sm",
            sizeClasses[size],
            onCenterClick && "cursor-pointer transition hover:scale-[1.03] hover:bg-[#20BBA3]/20 disabled:cursor-progress disabled:opacity-70"
          )}
          aria-label={onCenterClick ? "Start scan" : centerIcon?.name}
          title={onCenterClick ? "Start scan" : centerIcon?.name}
        >
          {centerContent ?? <centerIcon.Icon className={cn(iconSizeClasses[size])} />}
        </CenterTag>

        {/* Generate Orbits */}
        {[...Array(orbitCount)].map((_, orbitIdx) => {
          const orbitSize = `${8 + orbitGap * (orbitIdx + 1)}rem`
          const angleStep = (2 * Math.PI) / iconsPerOrbit
          const animationDuration = `${12 + orbitIdx * 6}s`
          const orbitIcons = safeIcons.slice(
            orbitIdx * iconsPerOrbit,
            orbitIdx * iconsPerOrbit + iconsPerOrbit
          )

          return (
            <div
              key={orbitIdx}
              className="border-muted-foreground/30 absolute rounded-full border-2 border-dotted"
              style={{
                width: orbitSize,
                height: orbitSize,
                animation: `orbit-spin ${animationDuration} linear infinite`,
              }}
            >
              {orbitIcons.map((iconConfig, iconIdx) => {
                const angle = iconIdx * angleStep
                const x = 50 + 50 * Math.cos(angle)
                const y = 50 + 50 * Math.sin(angle)

                return (
                  <div
                    key={`${orbitIdx}-${iconIdx}-${iconConfig.name ?? iconIdx}`}
                    className="bg-background/80 border-border/50 absolute rounded-full border p-1 shadow-lg backdrop-blur-sm"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <iconConfig.Icon className={cn(iconSizeClasses[size])} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrbitRotation
