import React from 'react'
import { Eye, Compass } from 'lucide-react'

// 8 Compass angles mapped to math canvas angles
const COMPASS_POINTS = [
  { label: 'N', name: 'NORTH (UP)', angleRad: -Math.PI / 2, deg: 270 },
  { label: 'NE', name: 'NORTH-EAST', angleRad: -Math.PI / 4, deg: 315 },
  { label: 'E', name: 'EAST (RIGHT)', angleRad: 0, deg: 0 },
  { label: 'SE', name: 'SOUTH-EAST', angleRad: Math.PI / 4, deg: 45 },
  { label: 'S', name: 'SOUTH (DOWN)', angleRad: Math.PI / 2, deg: 90 },
  { label: 'SW', name: 'SOUTH-WEST', angleRad: (3 * Math.PI) / 4, deg: 135 },
  { label: 'W', name: 'WEST (LEFT)', angleRad: Math.PI, deg: 180 },
  { label: 'NW', name: 'NORTH-WEST', angleRad: (-3 * Math.PI) / 4, deg: 225 },
]

export default function CompassHUD({
  telemetry,
  onSelectDirection,
  activeMode,
  selectedAngle
}) {
  const currentDeg = telemetry?.angleDeg ?? 0
  const isEyeContact = telemetry?.isEyeContact ?? false

  // Determine active compass label
  const getActiveLabel = () => {
    if (isEyeContact) return 'DIRECT EYE CONTACT'
    // Normalized angle 0..360
    const d = (currentDeg + 360) % 360
    if (d >= 337.5 || d < 22.5) return 'EAST (0°)'
    if (d >= 22.5 && d < 67.5) return 'SOUTH-EAST (45°)'
    if (d >= 67.5 && d < 112.5) return 'SOUTH (90°)'
    if (d >= 112.5 && d < 157.5) return 'SOUTH-WEST (135°)'
    if (d >= 157.5 && d < 202.5) return 'WEST (180°)'
    if (d >= 202.5 && d < 247.5) return 'NORTH-WEST (225°)'
    if (d >= 247.5 && d < 292.5) return 'NORTH (270°)'
    return 'NORTH-EAST (315°)'
  }

  return (
    <div 
      className="glass-card" 
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '320px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={16} color="var(--gold-accent)" />
          <span 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '0.72rem', 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase',
              color: 'var(--gold-glow)'
            }}
          >
            Kinematic Telemetry
          </span>
        </div>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: isEyeContact ? 'rgba(229, 190, 101, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isEyeContact ? 'var(--gold-accent)' : 'var(--border-subtle)'}`,
            fontSize: '0.68rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.1em',
            color: isEyeContact ? 'var(--gold-glow)' : 'var(--text-muted)'
          }}
        >
          <span 
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isEyeContact ? 'var(--gold-accent)' : '#4ade80',
              display: 'inline-block'
            }} 
            className={isEyeContact ? 'pulse-gold' : ''}
          />
          {telemetry?.fps || 60} FPS
        </div>
      </div>

      {/* Interactive Compass Dial */}
      <div 
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Outer Ring */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px dashed rgba(229, 190, 101, 0.35)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
          }}
        />

        {/* Dynamic Needle Indicator */}
        <div 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: `rotate(${currentDeg}deg)`,
            transition: 'transform 0.05s linear',
            pointerEvents: 'none'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '56px',
              height: '2px',
              background: 'linear-gradient(90deg, rgba(229, 190, 101, 0.1), var(--gold-glow))',
              transformOrigin: '0% 50%',
              boxShadow: '0 0 8px var(--gold-accent)'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              top: 'calc(50% - 3px)',
              left: 'calc(50% + 53px)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--gold-glow)',
              boxShadow: '0 0 10px var(--gold-accent)'
            }}
          />
        </div>

        {/* 8 Direction Buttons */}
        {COMPASS_POINTS.map((pt) => {
          // Angle on screen: 0° is Right (3 o'clock)
          const rad = pt.angleRad
          const radius = 70
          const x = 90 + radius * Math.cos(rad) - 13
          const y = 90 + radius * Math.sin(rad) - 13

          return (
            <button
              key={pt.label}
              onClick={() => onSelectDirection(pt.angleRad)}
              title={`Orient ${pt.name}`}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(50, 10, 8, 0.65)',
                color: 'var(--text-soft)',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                zIndex: 5
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gold-accent)'
                e.currentTarget.style.color = '#3b0908'
                e.currentTarget.style.borderColor = 'var(--gold-glow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(50, 10, 8, 0.65)'
                e.currentTarget.style.color = 'var(--text-soft)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
              }}
            >
              {pt.label}
            </button>
          )
        })}

        {/* Center Neutral Eye Contact Button */}
        <button
          onClick={() => onSelectDirection(null)} // null = center deadzone
          title="Direct Eye Contact (Center Neutral Pose)"
          style={{
            position: 'absolute',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: isEyeContact ? 'var(--gold-accent)' : 'rgba(70, 14, 12, 0.85)',
            border: `2px solid ${isEyeContact ? 'var(--gold-glow)' : 'rgba(229, 190, 101, 0.4)'}`,
            color: isEyeContact ? '#3b0908' : 'var(--gold-glow)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isEyeContact ? '0 0 16px rgba(229, 190, 101, 0.6)' : 'none',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
        >
          <Eye size={18} />
        </button>
      </div>

      {/* Telemetry Information Details */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Direction
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gold-glow)', fontFamily: 'var(--font-display)' }}>
            {getActiveLabel()}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Active Frame
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-pure)', fontFamily: 'var(--font-display)' }}>
            {telemetry?.frameIndex === 'CENTER' ? 'center.webp' : `#${telemetry?.frameIndex ?? 0} / 64`}
          </span>
        </div>
      </div>
    </div>
  )
}
