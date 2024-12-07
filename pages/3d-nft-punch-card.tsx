'use client'

import { useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function PunchCard({ punches, description, reward }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [rotated, setRotated] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        rotated ? Math.PI : 0,
        0.1
      )
    }
  })

  const handleClick = () => {
    setRotated(!rotated)
  }

  return (
    <group
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Front side */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
      </mesh>
      
      {/* Punches on front side */}
      {Array.from({ length: 10 }).map((_, index) => (
        <mesh key={`front-${index}`} position={[(index % 5 - 2) * 0.5, Math.floor(index / 5) * 0.5 - 0.5, 0.02]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color={index < punches ? 'red' : 'gray'} />
        </mesh>
      ))}

      {/* Back side */}
      <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color={hovered ? 'lightblue' : 'skyblue'} />
      </mesh>

      {/* Punches on back side */}
      {Array.from({ length: 10 }).map((_, index) => (
        <mesh key={`back-${index}`} position={[(index % 5 - 2) * 0.5, Math.floor(index / 5) * 0.5 - 0.5, -0.02]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color={index < punches ? 'red' : 'gray'} />
        </mesh>
      ))}

      {/* Description on back side */}
      <Text
        position={[0, 0.7, -0.02]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.1}
        maxWidth={2.5}
        textAlign="center"
        color="black"
      >
        {description}
      </Text>

      {/* Reward on back side */}
      <Text
        position={[0, -0.7, -0.02]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.12}
        maxWidth={2.5}
        textAlign="center"
        color="black"
      >
        Reward: {reward}
      </Text>
    </group>
  )
}

export default function NFTPunchCard() {
  const [punches, setPunches] = useState(3)
  const description = "Collect 10 punches to earn a free item!"
  const reward = "Free Coffee"

  return (
    <div className="w-full h-screen bg-gray-100">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls enableZoom={false} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <PunchCard punches={punches} description={description} reward={reward} />
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-md">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setPunches((prev) => (prev < 10 ? prev + 1 : prev))}
        >
          Add Punch
        </button>
        <p className="mt-2">Punches: {punches}/10</p>
      </div>
    </div>
  )
}