import React, { useState, useEffect, useRef, useCallback } from 'react'
import CharacterCanvas from './components/CharacterCanvas'
import { audioEngine } from './utils/audioEngine'
import { 
  ArrowUpRight, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Download
} from 'lucide-react'

export default function App() {
  // Telemetry from Canvas
  const [telemetry, setTelemetry] = useState(null)
  
  // Cursor & Aura Ring state
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })
  const [auraPos, setAuraPos] = useState({ x: -100, y: -100 })
  const [isCursorHovered, setIsCursorHovered] = useState(false)
  const cursorRef = useRef({ x: -100, y: -100 })
  const auraRef = useRef({ x: -100, y: -100 })

  // Interactive Modals State
  const [activeModal, setActiveModal] = useState(null) // 'work' | 'about' | 'contact' | 'resume'
  
  // Ambient Soundscape
  const [isAudioActive, setIsAudioActive] = useState(false)

  // Track Mouse Position
  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorRef.current = { x: e.clientX, y: e.clientY }
      setCursorPos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Smooth Trailing Aura Animation Loop (Magnetic Cursor)
  useEffect(() => {
    let animId
    const loop = () => {
      // Lerp aura position towards cursor position (factor ~0.18 for smooth trailing feel)
      auraRef.current.x += (cursorRef.current.x - auraRef.current.x) * 0.18
      auraRef.current.y += (cursorRef.current.y - auraRef.current.y) * 0.18
      setAuraPos({ x: auraRef.current.x, y: auraRef.current.y })

      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [])

  // Telemetry update
  const handleTelemetry = useCallback((data) => {
    setTelemetry(data)
    if (isAudioActive) {
      audioEngine.modulateWithDistance(data.distance, data.isEyeContact)
    }
  }, [isAudioActive])

  // Audio Toggle
  const toggleSound = () => {
    const active = audioEngine.toggle()
    setIsAudioActive(active)
  }

  // Interactive hover handlers for magnetic cursor scale
  const hoverProps = {
    onMouseEnter: () => setIsCursorHovered(true),
    onMouseLeave: () => setIsCursorHovered(false)
  }

  return (
    <div 
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#9a2320',
        cursor: 'none'
      }}
    >
      {/* Subtle luxury film grain */}
      <div className="film-grain" />

      {/* ========================================================================= */}
      {/* CUSTOM MAGNETIC CURSOR                                                    */}
      {/* ========================================================================= */}
      {/* Crisp Glowing White Dot */}
      <div 
        className="magnetic-cursor-dot"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`
        }}
      />
      {/* Smooth Trailing Aura Ring */}
      <div 
        className={`magnetic-aura-ring ${isCursorHovered ? 'hovered' : ''} ${telemetry?.isEyeContact ? 'eye-contact' : ''}`}
        style={{
          left: `${auraPos.x}px`,
          top: `${auraPos.y}px`
        }}
      />

      {/* ========================================================================= */}
      {/* 1. FULL SCREEN CANVAS STAGE (100vw, 100vh, object-fit: cover)             */}
      {/* ========================================================================= */}
      <CharacterCanvas
        responseFactor={0.26}
        deadzoneRatio={0.12}
        onTelemetryUpdate={handleTelemetry}
      />

      {/* ========================================================================= */}
      {/* 2. FLOATING FROSTED-GLASS NAVIGATION PILL CENTERED AT TOP                 */}
      {/* ========================================================================= */}
      <nav 
        className="nav-pill-container"
        style={{ pointerEvents: 'auto' }}
      >
        <button 
          className="nav-pill-btn"
          onClick={() => setActiveModal('work')}
          {...hoverProps}
        >
          [WORK]
        </button>
        <button 
          className="nav-pill-btn"
          onClick={() => setActiveModal('about')}
          {...hoverProps}
        >
          [ABOUT]
        </button>
        <button 
          className="nav-pill-btn"
          onClick={() => setActiveModal('contact')}
          {...hoverProps}
        >
          [CONTACT]
        </button>
      </nav>

      {/* Eye-contact status subtle indicator in top-left */}
      <div 
        style={{
          position: 'fixed',
          top: '32px',
          left: '48px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none'
        }}
      >
        <span 
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: telemetry?.isEyeContact ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
            boxShadow: telemetry?.isEyeContact ? '0 0 12px #ffffff' : 'none',
            display: 'inline-block'
          }}
          className={telemetry?.isEyeContact ? 'pulse-eye' : ''}
        />
        <span 
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.68rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: telemetry?.isEyeContact ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
            fontWeight: 500
          }}
        >
          {telemetry?.isEyeContact ? 'Direct Eye Contact' : '60 FPS Gaze Engine'}
        </span>
      </div>

      {/* Ambient Audio Pill in top-right */}
      <div 
        style={{
          position: 'fixed',
          top: '28px',
          right: '48px',
          zIndex: 40,
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={toggleSound}
          className="btn-talk-frosted"
          style={{
            padding: '8px 18px',
            fontSize: '0.72rem',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            backgroundColor: isAudioActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'
          }}
          {...hoverProps}
          title="Toggle Ambient Audio Soundscape"
        >
          {isAudioActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{isAudioActive ? 'Sound: On' : 'Sound: Off'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. HERO TYPOGRAPHY (BOTTOM-LEFT)                                          */}
      {/* ========================================================================= */}
      <div className="hero-typography-bottom-left">
        {/* "Hi, I'm" in clean, spaced modern sans-serif */}
        <span className="hero-subtitle-hi">
          Hi, I'm
        </span>

        {/* Name ("Eveneet") in large, elegant cursive script with soft drop shadow */}
        <h1 className="hero-name-cursive">
          Eveneet
        </h1>

        {/* Compact 3-line bio about designing using Canva (max-width ~340px) */}
        <p className="hero-canva-bio">
          Visual designer & Canva creator crafting aesthetic brand identities, 
          viral social media kits, and high-impact digital graphics 
          with effortless elegance.
        </p>

        {/* Two stylish white pill buttons: Resume & Let's Talk */}
        <div className="hero-cta-group">
          {/* Resume (Solid White with Arrow Icon) */}
          <button 
            className="btn-resume-solid"
            onClick={() => setActiveModal('resume')}
            {...hoverProps}
          >
            <span>Resume</span>
            <ArrowUpRight size={15} />
          </button>

          {/* Let's Talk (Frosted Glass / White Border) */}
          <button 
            className="btn-talk-frosted"
            onClick={() => setActiveModal('contact')}
            {...hoverProps}
          >
            <span>Let's Talk</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS / DRAWERS                                              */}
      {/* ========================================================================= */}
      {activeModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 3, 2, 0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
            pointerEvents: 'auto'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#821a18',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              color: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '22px',
                right: '22px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              {...hoverProps}
            >
              <X size={18} />
            </button>

            {/* MODAL: WORK */}
            {activeModal === 'work' && (
              <>
                <div>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)' }}>
                    Canva Portfolio
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-cursive)', fontSize: '2.4rem', margin: '4px 0 8px 0' }}>
                    Featured Creative Works
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.5 }}>
                    Specialized in visual storytelling, aesthetic template systems, and viral social media branding created in Canva.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>Aura Haute Couture Branding</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>Canva Pro • 2026</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      Complete visual identity kit, editorial lookbooks, and Instagram carousel templates with 250K+ reach.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>Kinetic Presentation Masterkit</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>Pitch Deck • 40 Slides</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      Clean typography layouts, custom infographics, and transition animations for luxury client pitches.
                    </p>
                  </div>

                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.94rem' }}>Social Media Growth Accelerator</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.6)' }}>TikTok & Reels Covers</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                      High-converting thumbnail suites and visual grids designed for lifestyle creators and fashion brands.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* MODAL: ABOUT */}
            {activeModal === 'about' && (
              <>
                <div>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)' }}>
                    About The Designer
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-cursive)', fontSize: '2.6rem', margin: '4px 0 8px 0' }}>
                    Eveneet
                  </h3>
                </div>

                <div style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>
                    I transform brand ideas into unforgettable visual identities using Canva’s complete creative suite. 
                    From luxury fashion layouts to viral marketing assets, my focus is on effortless aesthetic refinement.
                  </p>
                  <p>
                    My methodology balances crisp typography, curated color harmony, and strategic visual hierarchy 
                    to ensure your message captivates and converts on every screen.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '6px 14px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.12)', fontSize: '0.74rem' }}>
                    ✦ Canva Creator Expert
                  </span>
                  <span style={{ padding: '6px 14px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.12)', fontSize: '0.74rem' }}>
                    ✦ Brand Identity Systems
                  </span>
                  <span style={{ padding: '6px 14px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.12)', fontSize: '0.74rem' }}>
                    ✦ Social Media Growth
                  </span>
                </div>
              </>
            )}

            {/* MODAL: CONTACT */}
            {activeModal === 'contact' && (
              <>
                <div>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)' }}>
                    Collaboration
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-cursive)', fontSize: '2.4rem', margin: '4px 0 8px 0' }}>
                    Let's Connect
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                    Ready to elevate your visual identity or launch your next campaign? Drop a message below.
                  </p>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    alert("Thank you! Eveneet will reply to your message shortly.")
                    setActiveModal(null)
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email Address"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell me about your project, brand, or design needs..."
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem',
                      resize: 'none'
                    }}
                  />
                  <button 
                    type="submit"
                    className="btn-resume-solid"
                    style={{ justifyContent: 'center', marginTop: '6px' }}
                    {...hoverProps}
                  >
                    <span>Send Message</span>
                    <Send size={14} />
                  </button>
                </form>
              </>
            )}

            {/* MODAL: RESUME */}
            {activeModal === 'resume' && (
              <>
                <div>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.65)' }}>
                    Curriculum Vitae
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-cursive)', fontSize: '2.4rem', margin: '4px 0 8px 0' }}>
                    Eveneet's Resume
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                    Senior Visual Designer & Canva Design Specialist (2022 — Present)
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.84rem' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontWeight: 600 }}>✦ Core Expertise</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
                      Canva Pro Ecosystem, Brand Identity Guidelines, Typography Systems, Social Media Kits, Pitch Deck Architecture.
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontWeight: 600 }}>✦ Design Experience</div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
                      Over 150+ bespoke brand design templates, editorial layouts, and media kits created for global brands and creative entrepreneurs.
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    alert("Resume downloaded successfully.")
                    setActiveModal(null)
                  }}
                  className="btn-resume-solid"
                  style={{ justifyContent: 'center' }}
                  {...hoverProps}
                >
                  <Download size={15} />
                  <span>Download Full PDF Resume</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
