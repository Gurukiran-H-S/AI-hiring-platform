import React from 'react'

/**
 * Project Logo Component (HireAI / HireLab Master Logo)
 * Features stylized gradient H with AI neural profile, candidate search magnifying glass,
 * and verified candidate scoring checklist.
 */
export const Logo = ({ size = 'md', className = '', showText = false, textClassName = '', variant = 'full' }) => {
  const sizeMap = {
    xs: 'w-6 h-auto',
    sm: 'w-8 h-auto',
    md: 'w-10 h-auto',
    lg: 'w-16 h-auto',
    xl: 'w-24 h-auto',
    '2xl': 'w-36 h-auto',
    hero: 'w-56 h-auto'
  }

  const dimensionClass = sizeMap[size] || size
  const imgSrc = variant === 'mark' ? '/logo-mark.png' : '/logo.png'

  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      <img
        src={imgSrc}
        alt="AI Hiring Logo"
        className={`${dimensionClass} object-contain select-none transition-transform duration-200`}
        loading="eager"
      />
      {showText && (
        <span className={`font-extrabold text-[#172B4D] tracking-tight font-display ${textClassName}`}>
          <span className="text-[#0A66C2]">AI</span> Hiring
        </span>
      )}
    </div>
  )
}

export default Logo
