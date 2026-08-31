import React from 'react'

/**
 * Project Logo Component (HireAI / HireLab Master Logo)
 * Features stylized gradient H with AI neural profile, candidate search magnifying glass,
 * and verified candidate scoring checklist.
 */
export const Logo = ({ size = 'md', className = '', showText = false, textClassName = '' }) => {
  const sizeMap = {
    xs: 'w-6 h-auto',
    sm: 'w-8 h-auto',
    md: 'w-9 h-auto',
    lg: 'w-12 h-auto',
    xl: 'w-20 h-auto',
    '2xl': 'w-32 h-auto',
    hero: 'w-48 h-auto'
  }

  const dimensionClass = sizeMap[size] || size

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <img
        src="/logo.svg"
        alt="HireAI Logo"
        className={`${dimensionClass} object-contain select-none transition-transform duration-200`}
        loading="eager"
      />
      {showText && (
        <span className={`font-extrabold text-[#172B4D] tracking-tight font-display ${textClassName}`}>
          Hire<span className="text-[#0A66C2]">AI</span>
        </span>
      )}
    </div>
  )
}

export default Logo
