import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

export const AIRecruitmentCore = ({ mousePos = { x: 0, y: 0 } }) => {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 500
    const height = container.clientHeight || 500

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Central Glowing AI Core (Icosahedron / Sphere)
    const coreGeometry = new THREE.IcosahedronGeometry(1.6, 2)
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    })
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial)
    scene.add(coreMesh)

    // Inner Glowing Core Sphere
    const innerGeometry = new THREE.SphereGeometry(1.0, 32, 32)
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
    })
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial)
    scene.add(innerMesh)

    // Orbital Ring 1
    const ring1Geometry = new THREE.TorusGeometry(2.4, 0.02, 16, 100)
    const ring1Material = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.6 })
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material)
    ring1.rotation.x = Math.PI / 3
    scene.add(ring1)

    // Orbital Ring 2
    const ring2Geometry = new THREE.TorusGeometry(3.0, 0.015, 16, 100)
    const ring2Material = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.5 })
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material)
    ring2.rotation.y = Math.PI / 4
    scene.add(ring2)

    // Particle Cloud System
    const particleCount = 200
    const particlesGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 10
      particlePositions[i + 1] = (Math.random() - 0.5) * 10
      particlePositions[i + 2] = (Math.random() - 0.5) * 10
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.7,
    })
    const particleSystem = new THREE.Points(particlesGeometry, particleMaterial)
    scene.add(particleSystem)

    // Lighting
    const pointLight = new THREE.PointLight(0x6366f1, 2, 10)
    pointLight.position.set(0, 0, 4)
    scene.add(pointLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // Animation Loop
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      coreMesh.rotation.x += 0.003
      coreMesh.rotation.y += 0.005
      innerMesh.rotation.y -= 0.004

      ring1.rotation.z += 0.004
      ring2.rotation.z -= 0.003

      particleSystem.rotation.y += 0.001

      // Mouse Parallax Smooth Interpolation
      const targetX = (mousePos.x * 0.5 - camera.position.x) * 0.05
      const targetY = (-mousePos.y * 0.5 - camera.position.y) * 0.05
      camera.position.x += targetX
      camera.position.y += targetY
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }
    animate()

    // Resize Handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      coreGeometry.dispose()
      coreMaterial.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
      ring1Geometry.dispose()
      ring1Material.dispose()
      ring2Geometry.dispose()
      ring2Material.dispose()
      particlesGeometry.dispose()
      particleMaterial.dispose()
    }
  }, [mousePos])

  return (
    <div className="relative w-full h-[480px] md:h-[550px] flex items-center justify-center">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Orbiting HTML Node Badges overlay around core */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Node 1: RESUME */}
        <div className="absolute -top-4 md:top-6 left-1/4 animate-bounce-slow">
          <div className="glass-card px-3 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/60 text-indigo-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            📄 RESUME NLP
          </div>
        </div>

        {/* Node 2: ATS */}
        <div className="absolute top-1/4 right-2 md:right-8 animate-float">
          <div className="glass-card px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            🎯 ATS 87% MATCH
          </div>
        </div>

        {/* Node 3: SKILLS */}
        <div className="absolute bottom-1/4 left-2 md:left-6 animate-float-delayed">
          <div className="glass-card px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-950/60 text-purple-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            🧠 SKILL GAP AI
          </div>
        </div>

        {/* Node 4: RANKING */}
        <div className="absolute -bottom-2 md:bottom-8 right-1/4 animate-bounce-slow">
          <div className="glass-card px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-950/60 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            🏆 RECRUITER RANKING
          </div>
        </div>
      </div>
    </div>
  )
}
