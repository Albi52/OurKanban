import React from 'react'
import { Squares2X2Icon } from '../components/icons/BrandIcon'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
}

const sizeMap = {
  sm: { icon: 'h-5 w-5', text: 'text-lg' },
  md: { icon: 'h-7 w-7', text: 'text-2xl' },
  lg: { icon: 'h-10 w-10', text: 'text-4xl' },
  xl: { icon: 'h-16 w-16', text: 'text-6xl md:text-7xl lg:text-8xl' },
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const s = sizeMap[size]
  return (
    <div className="flex items-center gap-3 select-none" data-testid="brand-logo">
      <div className={`${s.icon} shrink-0 text-zinc-50`}>
        <Squares2X2Icon />
      </div>
      {showText && (
        <span className={`${s.text} font-heading font-light tracking-tighter text-zinc-50`}>
          Our<span className="font-medium">Kanban</span>
        </span>
      )}
    </div>
  )
}