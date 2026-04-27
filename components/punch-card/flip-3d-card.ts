'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { Vector3, Group } from 'three'
import type { PunchCard } from '@/lib/types'
import { PunchCardComponent } from './punch-card'
import { cn } from '@/lib/utils'

interface Flip3DCardProps {
  punchCard: PunchCard
  showStatus?: boolean
}

function CardMesh({ punchCard, showStatus = true }: Flip3DCardProps) {
  const groupRef = useRef<Group>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useFrame(() => {
    if (groupRef.current) {
      const targetRotation = isFlipped ? Math.PI : 0
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.1
    }
  })

  const handlePointerEnter = () => setIsHovering(true)
  const handlePointerLeave = () => setIsHovering(false)
  const handleClick = () => setIsFlipped(!isFlipped)

  const { size } = useThree()
  const cardAspectRatio = 0.68
  const scale = size.height < 800 ? 1.5 : 2

  return (
    <group
      ref={groupRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      scale={scale}
      position={[0, 0, 0]}
    >
      {/* Front Face - Punch Card */}
      <Html
        transform
        position={[0, 0, 0.01]}
        scale={1}
        style={{
          width: `${200 * cardAspectRatio}px`,
          height: '280px',
        }}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all"
          style={{
            backfaceVisibility: 'hidden',
            opacity: isFlipped ? 0 : 1,
            transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <PunchCardComponent
            punchCard={punchCard}
            size="md"
            showStatus={showStatus}
            className="w-full h-full"
          />
        </div>
      </Html>

      {/* Back Face - Program Details */}
      <Html
        transform
        position={[0, 0, -0.01]}
        scale={1}
        style={{
          width: `${200 * cardAspectRatio}px`,
          height: '280px',
        }}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            opacity: isFlipped ? 1 : 0,
            transform: `rotateY(${isFlipped ? 0 : 180}deg)`,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h4 className="text-sm font-bold text-white truncate">
                {punchCard.program.name}
              </h4>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">
              {punchCard.program.description}
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Merchant</span>
              <span className="text-white font-medium text-right">
                {punchCard.program.metadata.merchantName || 'Business'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Reward</span>
              <span className="text-primary font-bold">{punchCard.reward}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Required</span>
              <span className="text-white font-medium">{punchCard.requiredPunches} punches</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">Click to flip</p>
          </div>
        </div>
      </Html>
    </group>
  )
}

export function Flip3DCard({ punchCard, showStatus = true }: Flip3DCardProps) {
  return (
    <div className="w-full h-80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden">
      <Canvas
        camera={{
          position: [0, 0, 4],
          fov: 50,
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, 10]} intensity={0.4} />

        <CardMesh punchCard={punchCard} showStatus={showStatus} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  )
}