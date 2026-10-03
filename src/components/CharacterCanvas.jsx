import React, { useEffect, useRef, useState, useCallback } from 'react'

/**
 * CharacterCanvas
 * 
 * Strict Technical Constraints:
 * 1. Zero CSS 3D transforms: rock-solid motionless container & canvas.
 * 2. Zero MP4 seeking or playback at runtime.
 * 3. Preloads 64 WebP frames + center.webp.
 * 4. Zero-ghosting: exactly ONE crisp frame drawn at 100% opacity each rAF tick.
 * 5. Shortest-path circular angular lerp (factor ~0.26, ~35ms response).
 * 6. Eye contact deadzone (~12% screen radius) renders center.webp.
 * 7. Seamless background matching #9a2320 covering 100vw x 100vh.
 */
export default function CharacterCanvas({
  responseFactor = 0.26,
  deadzoneRatio = 0.12,
  onTelemetryUpdate,
  onLoaded
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  
  const [loadProgress, setLoadProgress] = useState(0)
  const [isReady, setIsReady] = useState(false)
  
  // Animation state in refs for 60fps zero-allocation rAF loop
  const animState = useRef({
    images: [],
    centerImage: null,
    currentAngle: 0,
    cursorX: window.innerWidth * 0.5,
    cursorY: window.innerHeight * 0.35,
    faceScreenX: window.innerWidth * 0.5,
    faceScreenY: window.innerHeight * 0.375,
    isDeadzone: false,
    frameIndex: 0,
    fps: 60
  })

  // 1. Preload 64 frames + center.webp
  useEffect(() => {
    let isCancelled = false
    const totalFrames = 64
    const totalToLoad = totalFrames + 1
    let loadedCount = 0

    const images = new Array(totalFrames)
    const centerImg = new Image()

    const onImageLoad = () => {
      if (isCancelled) return
      loadedCount++
      const progress = Math.round((loadedCount / totalToLoad) * 100)
      setLoadProgress(progress)
      
      if (loadedCount === totalToLoad) {
        animState.current.images = images
        animState.current.centerImage = centerImg
        setIsReady(true)
        if (onLoaded) onLoaded()
      }
    }

    centerImg.src = '/center.webp'
    centerImg.onload = onImageLoad
    centerImg.onerror = () => {
      centerImg.src = '/center.webp?' + Date.now()
    }

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image()
      img.src = `/frames/frame_${i}.webp`
      img.onload = onImageLoad
      images[i] = img
    }

    return () => {
      isCancelled = true
    }
  }, [onLoaded])

  // Shortest-path circular angular lerp
  const lerpAngle = useCallback((current, target, factor) => {
    let diff = target - current
    while (diff < -Math.PI) diff += 2 * Math.PI
    while (diff > Math.PI) diff -= 2 * Math.PI
    return current + diff * factor
  }, [])

  // Window cursor tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      animState.current.cursorX = e.clientX
      animState.current.cursorY = e.clientY
    }

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        animState.current.cursorX = e.touches[0].clientX
        animState.current.cursorY = e.touches[0].clientY
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  // 60 FPS Canvas Render Loop
  useEffect(() => {
    if (!isReady) return

    let animId
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    const updateCanvasDimensions = () => {
      if (!canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight
      
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    updateCanvasDimensions()
    window.addEventListener('resize', updateCanvasDimensions)

    let fpsTimer = performance.now()
    let frameCounter = 0
    let currentFps = 60

    const render = (now) => {
      animId = requestAnimationFrame(render)

      frameCounter++
      if (now - fpsTimer >= 500) {
        currentFps = Math.round((frameCounter * 1000) / (now - fpsTimer))
        frameCounter = 0
        fpsTimer = now
      }

      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)

      // 1. Fill exact matching solid background (#9a2320)
      ctx.fillStyle = '#9a2320'
      ctx.fillRect(0, 0, width, height)

      // 2. Full-Screen framing: scale character to fit screen height
      const imgAspect = 720 / 1280
      const drawH = Math.max(height * 1.02, 540)
      const drawW = drawH * imgAspect
      const drawX = (width - drawW) / 2
      const drawY = height - drawH // Anchor naturally to the bottom edge

      // Face center coordinates (bridge of nose at X: 50%, Y: 37.5%)
      const faceX = drawX + drawW * 0.50
      const faceY = drawY + drawH * 0.375
      animState.current.faceScreenX = faceX
      animState.current.faceScreenY = faceY

      // Deadzone calculation (12% of screen radius)
      const screenRadius = Math.min(width, height)
      const deadzonePx = screenRadius * deadzoneRatio

      const dx = animState.current.cursorX - faceX
      const dy = animState.current.cursorY - faceY
      const dist = Math.hypot(dx, dy)
      const isDeadzone = dist < deadzonePx
      animState.current.isDeadzone = isDeadzone

      // Target angle
      const targetA = Math.atan2(dy, dx)

      // Shortest-path circular angular lerp
      animState.current.currentAngle = lerpAngle(
        animState.current.currentAngle,
        targetA,
        responseFactor
      )

      // Normalize angle to [0, 2π)
      let norm = animState.current.currentAngle % (2 * Math.PI)
      if (norm < 0) norm += 2 * Math.PI

      // Map smoothed angle to nearest frame index (0..63)
      const frameIdx = Math.round((norm / (2 * Math.PI)) * 64) % 64
      animState.current.frameIndex = frameIdx

      // Select active image: center.webp for eye contact deadzone, else frame index
      const activeImg = isDeadzone
        ? animState.current.centerImage
        : animState.current.images[frameIdx]

      // 3. Draw EXACTLY ONE crisp frame at 100% opacity (no alpha blending!)
      if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
        ctx.globalAlpha = 1.0
        ctx.drawImage(activeImg, drawX, drawY, drawW, drawH)
      }

      ctx.restore()

      // Report telemetry
      if (onTelemetryUpdate) {
        onTelemetryUpdate({
          angleDeg: Math.round((norm * 180) / Math.PI),
          frameIndex: isDeadzone ? 'CENTER' : frameIdx,
          isEyeContact: isDeadzone,
          distance: Math.round(dist),
          deadzoneRadius: Math.round(deadzonePx),
          fps: currentFps,
          faceX,
          faceY
        })
      }
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', updateCanvasDimensions)
    }
  }, [isReady, responseFactor, deadzoneRatio, lerpAngle, onTelemetryUpdate])

  return (
    <div ref={containerRef} className="full-screen-stage">
      {/* Loading Progress State */}
      {!isReady && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#9a2320',
            zIndex: 100,
            gap: '16px'
          }}
        >
          <div 
            style={{
              fontFamily: 'var(--font-cursive)',
              fontSize: '3.5rem',
              color: '#ffffff',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            Eveneet
          </div>
          <div 
            style={{
              width: '160px',
              height: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                width: `${loadProgress}%`,
                height: '100%',
                backgroundColor: '#ffffff',
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>
          <span 
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.2em',
              color: 'rgba(255, 255, 255, 0.65)',
              textTransform: 'uppercase'
            }}
          >
            Loading Experience ({loadProgress}%)
          </span>
        </div>
      )}

      {/* Rock-solid, zero-3D transform Canvas covering full viewport */}
      <canvas
        ref={canvasRef}
        id="character-canvas"
        className="full-screen-canvas"
      />
    </div>
  )
}
