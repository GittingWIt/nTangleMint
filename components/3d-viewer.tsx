import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function InstancedBoxes({ count = 100 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const tempObject = useMemo(() => new THREE.Object3D(), [])

  const colorArray = useMemo(() => 
    Float32Array.from(new Array(count).fill(null).flatMap(() => [
      Math.random(), Math.random(), Math.random()
    ])),
    [count]
  )

  useFrame((state) => {
    for (let i = 0; i < count; i++) {
      const time = state.clock.getElapsedTime()
      const x = Math.sin(time + i * 0.1) * 2
      const y = Math.cos(time + i * 0.1) * 2
      const z = Math.sin(time * 0.5 + i * 0.1) * 2

      tempObject.position.set(x, y, z)
      tempObject.rotation.x = Math.sin(time + i) * 0.5
      tempObject.rotation.y = Math.cos(time + i) * 0.5
      tempObject.updateMatrix()

      meshRef.current.setMatrixAt(i, tempObject.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.5, 0.5, 0.5]}>
        <instancedBufferAttribute 
          attach="attributes-color" 
          args={[colorArray, 3]} 
        />
      </boxGeometry>
      <meshPhongMaterial vertexColors />
    </instancedMesh>
  )
}

export default function ThreeDViewer() {
  return (
    <div className="w-full h-[600px] bg-background">
      <Canvas 
        camera={{ position: [0, 0, 15] }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <InstancedBoxes />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}