'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

export interface NFTLayer {
  type: 'color' | 'gradient' | 'image' | 'icon' | 'pattern' | 'svg'
  content: string
  opacity?: number
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  rotation?: number
  scale?: number
  position?: {
    x: number
    y: number
  }
}

export interface NFTDesign {
  layers: NFTLayer[]
  aspectRatio?: '1:1' | '2:1' | '16:9' | string
  borderRadius?: string
  animation?: {
    type: 'rotate' | 'pulse' | 'shake' | 'none'
    duration?: number
    delay?: number
  }
  border?: {
    width: number
    style: 'solid' | 'dashed' | 'dotted'
    color: string
  }
  shadow?: {
    color: string
    blur: number
    spread: number
    x: number
    y: number
  }
}

const defaultNFTDesign: NFTDesign = {
  layers: [
    {
      type: 'gradient',
      content: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
    },
    {
      type: 'icon',
      content: '☕',
      opacity: 0.1,
      blendMode: 'overlay'
    }
  ],
  aspectRatio: '2:1',
  borderRadius: '0.5rem',
  animation: {
    type: 'none',
    duration: 2
  }
}

interface NFTVisualizationProps {
  design?: Partial<NFTDesign>
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export const NFTVisualization: React.FC<NFTVisualizationProps> = ({
  design = {},
  className = '',
  onClick,
  interactive = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mergedDesign: NFTDesign = {
    ...defaultNFTDesign,
    ...design,
    layers: [...(design.layers || defaultNFTDesign.layers)]
  }

  useEffect(() => {
    if (!interactive || !containerRef.current) return

    const container = containerRef.current
    let isHovering = false
    let requestId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovering) return

      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      container.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`
    }

    const handleMouseEnter = () => {
      isHovering = true
      container.style.transition = 'transform 0.1s'
    }

    const handleMouseLeave = () => {
      isHovering = false
      container.style.transition = 'transform 0.5s'
      container.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)'
    }

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseenter', handleMouseEnter)
      container.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (interactive) {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseenter', handleMouseEnter)
        container.removeEventListener('mouseleave', handleMouseLeave)
        cancelAnimationFrame(requestId)
      }
    }
  }, [interactive])

  const renderLayer = (layer: NFTLayer, index: number) => {
    const commonStyles: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      mixBlendMode: layer.blendMode || 'normal',
      transform: `
        rotate(${layer.rotation || 0}deg)
        scale(${layer.scale || 1})
        translate(${layer.position?.x || 0}px, ${layer.position?.y || 0}px)
      `
    }

    switch (layer.type) {
      case 'color':
        return <div key={index} style={{ ...commonStyles, backgroundColor: layer.content }} />
      
      case 'gradient':
        return <div key={index} style={{ ...commonStyles, background: layer.content }} />
      
      case 'image':
        return (
          <Image
            key={index}
            src={layer.content || "/placeholder.svg"}
            alt={`NFT Layer ${index}`}
            fill
            className="object-cover"
            style={commonStyles}
          />
        )
      
      case 'icon':
        return (
          <div 
            key={index} 
            style={{ 
              ...commonStyles, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '6rem'
            }}
          >
            {layer.content}
          </div>
        )
      
      case 'pattern':
        return (
          <div
            key={index}
            style={{
              ...commonStyles,
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(layer.content)}")`,
              backgroundRepeat: 'repeat'
            }}
          />
        )
      
      case 'svg':
        return (
          <div
            key={index}
            style={commonStyles}
            dangerouslySetInnerHTML={{ __html: layer.content }}
          />
        )
      
      default:
        return null
    }
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: mergedDesign.aspectRatio?.replace(':', '/'),
    borderRadius: mergedDesign.borderRadius,
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.3s ease-in-out',
    ...(mergedDesign.border && {
      border: `${mergedDesign.border.width}px ${mergedDesign.border.style} ${mergedDesign.border.color}`
    }),
    ...(mergedDesign.shadow && {
      boxShadow: `${mergedDesign.shadow.x}px ${mergedDesign.shadow.y}px ${mergedDesign.shadow.blur}px ${mergedDesign.shadow.spread}px ${mergedDesign.shadow.color}`
    })
  }

  const animationClass = mergedDesign.animation?.type !== 'none'
    ? `nft-${mergedDesign.animation?.type}`
    : ''

  return (
    <div
      ref={containerRef}
      className={`nft-visualization ${animationClass} ${className}`}
      style={containerStyle}
      onClick={onClick}
    >
      {mergedDesign.layers.map(renderLayer)}
    </div>
  )
}