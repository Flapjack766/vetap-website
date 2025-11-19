'use client';

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export function ReviewCard3DViewer() {
  const t = useTranslations();
  // الزاوية المعروضة فعليًا على الشاشة
  const [renderRotation, setRenderRotation] = useState({ x: 14, y: -30 });
  const renderRotationRef = useRef({ x: 14, y: -30 });
  
  // حالة النسخة (فاتحة/داكنة)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionAnimationRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  // الهدف الذي نميل إليه تدريجيًا (interpolation)
  const targetRotationRef = useRef({ x: 14, y: -30 });

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // دوران تلقائي
  const autoRotateRef = useRef(true);
  const autoRotateSpeedRef = useRef(0.08);
  const lastTimeRef = useRef<number>(0);
  
  // حدود مخصصة لسرعة الدوران
  const MAX_AUTO_ROTATION_SPEED = 0.08;
  const MAX_THEME_SWITCH_SPEED = 0.25;
  const MAX_DRAG_ROTATION_SPEED = 0.3;
  
  // العودة التلقائية للوضع الأصلي
  const returnToDefaultRef = useRef(false);
  const defaultRotation = { x: 14, y: -30 };
  const returnSpeedRef = useRef(0.05);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  
  // دالة لتطبيق الحد الأقصى لسرعة الدوران حسب النوع
  const applyMaxRotationSpeed = useCallback((
    currentY: number, 
    newY: number, 
    deltaTime: number = 16.67,
    speedType: 'auto' | 'theme' | 'drag' = 'auto'
  ): number => {
    const deltaY = newY - currentY;
    
    const maxSpeed = speedType === 'theme' 
      ? MAX_THEME_SWITCH_SPEED 
      : speedType === 'drag'
      ? MAX_DRAG_ROTATION_SPEED
      : MAX_AUTO_ROTATION_SPEED;
    
    const normalizedDeltaTime = Math.min(deltaTime, 50);
    const maxDelta = maxSpeed * (normalizedDeltaTime / 16.67);
    
    if (Math.abs(deltaY) > maxDelta) {
      return currentY + (deltaY > 0 ? maxDelta : -maxDelta);
    }
    
    return newY;
  }, []);

  const updateRotation = useCallback((newRotation: { x: number; y: number }) => {
    renderRotationRef.current = newRotation;
    setRenderRotation(newRotation);
  }, []);

  // دالة التبديل بين النسخة الفاتحة والداكنة مع دوران
  const toggleTheme = useCallback(() => {
    if (isTransitioningRef.current || isDraggingRef.current) {
      return;
    }
    
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    
    autoRotateRef.current = false;
    returnToDefaultRef.current = false;
    
    let currentY = renderRotationRef.current.y;
    
    // لا تطبيع هنا - السماح بالدوران المستمر
    targetRotationRef.current.y = currentY;
    
    const normalizedY = ((currentY % 360) + 360) % 360; // للبحث عن الحافة فقط

    const distTo90 = Math.min(
      (90 - normalizedY + 360) % 360,
      (normalizedY - 90 + 360) % 360
    );
    const distTo270 = Math.min(
      (270 - normalizedY + 360) % 360,
      (normalizedY - 270 + 360) % 360
    );
    
    const nearestEdge = distTo90 < distTo270 ? 90 : 270;
    
    let normalizedToEdge = nearestEdge;
    if (nearestEdge === 90) {
      const clockwise = (90 - normalizedY + 360) % 360;
      const counterClockwise = (normalizedY - 90 + 360) % 360;
      if (clockwise < counterClockwise) {
        normalizedToEdge = currentY + clockwise;
      } else {
        normalizedToEdge = currentY - counterClockwise;
      }
    } else {
      const clockwise = (270 - normalizedY + 360) % 360;
      const counterClockwise = (normalizedY - 270 + 360) % 360;
      if (clockwise < counterClockwise) {
        normalizedToEdge = currentY + clockwise;
      } else {
        normalizedToEdge = currentY - counterClockwise;
      }
    }
    
    const startY = currentY;
    const switchY = normalizedToEdge;
    const finalY = startY + 360;
    const duration = 2000;
    const startTime = performance.now();
    
    const targetEdgeAngle = nearestEdge;
    
    if (transitionAnimationRef.current !== null) {
      cancelAnimationFrame(transitionAnimationRef.current);
      transitionAnimationRef.current = null;
    }
    
    let hasSwitched = false;
    let lastFrameTime = startTime;
    
    const animateRotation = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      if (elapsed < 0) {
        transitionAnimationRef.current = requestAnimationFrame(animateRotation);
        return;
      }
      
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      
      const edgeProgressRatio = 0.3;
      const edgeDuration = duration * edgeProgressRatio;
      
      let currentYAnimation;
      let shouldSwitch = false;
      
      if (elapsed < edgeDuration) {
        const edgeProgress = Math.min(elapsed / edgeDuration, 1);
        
        const easeProgress = edgeProgress < 0.5
          ? 2 * edgeProgress * edgeProgress
          : 1 - Math.pow(-2 * edgeProgress + 2, 2) / 2;
        
        const deltaToEdge = switchY - startY;
        currentYAnimation = startY + deltaToEdge * easeProgress;
        
        let currentNormalized = currentYAnimation;
        while (currentNormalized > 360) currentNormalized -= 360;
        while (currentNormalized < -360) currentNormalized += 360;
        
        let edgeNormalized = targetEdgeAngle;
        
        let remainingDistance = Math.abs(currentNormalized - edgeNormalized);
        if (remainingDistance > 180) {
          remainingDistance = 360 - remainingDistance;
        }
        
        if (remainingDistance < 8 && !hasSwitched) {
          shouldSwitch = true;
        }
      } else {
        const remainingProgress = (elapsed - edgeDuration) / (duration - edgeDuration);
        const easeProgress = remainingProgress < 0.5
          ? 2 * remainingProgress * remainingProgress
          : 1 - Math.pow(-2 * remainingProgress + 2, 2) / 2;
        
        const progressFromStart = Math.min(elapsed / duration, 1);
        
        const totalEaseProgress = progressFromStart < 0.5
          ? 2 * progressFromStart * progressFromStart
          : 1 - Math.pow(-2 * progressFromStart + 2, 2) / 2;
        
        const totalRotation = 360 * totalEaseProgress;
        currentYAnimation = startY + totalRotation;
        
        if (!hasSwitched) {
          let currentNormalized = currentYAnimation;
          while (currentNormalized > 360) currentNormalized -= 360;
          while (currentNormalized < -360) currentNormalized += 360;
          
          let remainingDistance = Math.abs(currentNormalized - targetEdgeAngle);
          if (remainingDistance > 180) {
            remainingDistance = 360 - remainingDistance;
          }
          
          if (remainingDistance < 8) {
            shouldSwitch = true;
          }
        }
      }
      
      if (elapsed < edgeDuration) {
        targetRotationRef.current.y = currentYAnimation;
      } else {
        const currentTargetY = targetRotationRef.current.y;
        const normalizedDeltaTime = Math.min(deltaTime, 50);
        const newY = applyMaxRotationSpeed(currentTargetY, currentYAnimation, normalizedDeltaTime, 'theme');
        targetRotationRef.current.y = newY;
      }
      
      if (!hasSwitched && shouldSwitch) {
        setIsDarkMode(prev => !prev);
        hasSwitched = true;
      }
      
      const totalProgress = Math.min(elapsed / duration, 1);
      
      if (totalProgress < 1) {
        transitionAnimationRef.current = requestAnimationFrame(animateRotation);
      } else {
        let finalY = targetRotationRef.current.y;
        // لا تطبيع هنا - السماح بالدوران المستمر
        targetRotationRef.current.y = finalY;
        
        transitionAnimationRef.current = null;
        
        setTimeout(() => {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          autoRotateRef.current = true;
        }, 400);
      }
    };
    
    transitionAnimationRef.current = requestAnimationFrame(animateRotation);
  }, [applyMaxRotationSpeed]);

  const startDrag = useCallback((x: number, y: number) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    returnToDefaultRef.current = false;
    lastPosRef.current = { x, y };
  }, []);

  const moveDrag = useCallback((x: number, y: number) => {
    if (!isDraggingRef.current) return;
    
    if (!lastPosRef.current) {
      lastPosRef.current = { x, y };
      return;
    }

    const deltaX = x - lastPosRef.current.x;
    const deltaY = y - lastPosRef.current.y;

    const rotateSpeed = 0.3;

    const nextX = clamp(
      targetRotationRef.current.x + deltaY * rotateSpeed,
      -40,
      40
    );

    const desiredY = targetRotationRef.current.y + deltaX * rotateSpeed;
    
    const currentY = targetRotationRef.current.y;
    const nextY = applyMaxRotationSpeed(currentY, desiredY, 16.67, 'drag');

    targetRotationRef.current = { x: nextX, y: nextY };
    lastPosRef.current = { x, y };
  }, [applyMaxRotationSpeed]);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    lastPosRef.current = null;
    
    returnToDefaultRef.current = true;
    
    setTimeout(() => {
      if (!isDraggingRef.current) {
        autoRotateRef.current = true;
      }
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionAnimationRef.current !== null) {
        cancelAnimationFrame(transitionAnimationRef.current);
        transitionAnimationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        moveDrag(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        endDrag();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [moveDrag, endDrag]);

  useEffect(() => {
    let isRunning = true;
    const initialTime = performance.now();
    lastTimeRef.current = initialTime;

    const animate = (currentTime: number) => {
      if (!isRunning) return;

      let deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime > 100) {
        deltaTime = 16.67;
      }
      
      lastTimeRef.current = currentTime;

      if (returnToDefaultRef.current && !isDraggingRef.current) {
        const dx = defaultRotation.x - targetRotationRef.current.x;
        const dy = defaultRotation.y - targetRotationRef.current.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.3) {
          const normalizedSpeed = returnSpeedRef.current * (deltaTime / 16.67);
          const desiredX = targetRotationRef.current.x + dx * normalizedSpeed;
          const desiredY = targetRotationRef.current.y + dy * normalizedSpeed;
          
          targetRotationRef.current.x = applyMaxRotationSpeed(targetRotationRef.current.x, desiredX, deltaTime, 'auto');
          targetRotationRef.current.y = applyMaxRotationSpeed(targetRotationRef.current.y, desiredY, deltaTime, 'auto');
        } else {
          targetRotationRef.current = { ...defaultRotation };
          returnToDefaultRef.current = false;
        }
      }
      
      if (autoRotateRef.current && !isDraggingRef.current && !returnToDefaultRef.current && !isTransitioningRef.current) {
        const maxDeltaTime = 50;
        const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);
        const normalizedSpeed = autoRotateSpeedRef.current * (clampedDeltaTime / 16.67);
        
        const currentTargetY = targetRotationRef.current.y;
        const newY = currentTargetY + normalizedSpeed;
        
        targetRotationRef.current.y = applyMaxRotationSpeed(currentTargetY, newY, clampedDeltaTime, 'auto');
      }

      const current = renderRotationRef.current;
      const target = targetRotationRef.current;

      const smoothFactor = 0.1;

      let nextX = current.x + (target.x - current.x) * smoothFactor;
      let nextY = current.y + (target.y - current.y) * smoothFactor;

      // لا تطبيع - السماح بالدوران المستمر
      const threshold = 0.03;
      if (
        Math.abs(nextX - current.x) > threshold ||
        Math.abs(nextY - current.y) > threshold
      ) {
        updateRotation({ x: nextX, y: nextY });
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [updateRotation, applyMaxRotationSpeed]);

  // المقاسات الدقيقة: العرض 85.60 mm × الارتفاع 53.98 mm (بطاقة طولية - مقلوبة)
  const CARD_ASPECT = 53.98 / 85.60;

  const frontImage = isDarkMode ? "/images/gf2.png" : "/images/gf1.png";
  const backImage = isDarkMode ? "/images/gb2.png" : "/images/gb1.png";

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="absolute -top-12 right-0 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isTransitioning && !isDraggingRef.current) {
              toggleTheme();
            }
          }}
          disabled={isTransitioning || isDraggingRef.current}
          className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-neutral-700"
        >
          <span>{isDarkMode ? "☀️" : "🌙"}</span>
          <span>{isDarkMode ? t('NFC42') : t('NFC43')}</span>
        </button>
      </div>
      
      <div
        className="relative w-full"
        style={{
          aspectRatio: CARD_ASPECT,
          perspective: "1400px",
        }}
      >
      <div
        className="relative w-full h-full select-none cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (e.touches.length > 0) {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (isDraggingRef.current && e.touches.length > 0) {
            e.preventDefault();
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          endDrag();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          endDrag();
        }}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute inset-0 rounded-3xl shadow-2xl shadow-black/60"
          style={{
            transformStyle: "preserve-3d",
            transform: `
              translateZ(0px)
              rotateX(${renderRotation.x}deg)
              rotateY(${renderRotation.y}deg)
              translateY(-6px)
            `,
            transition: "none",
            willChange: "transform",
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
            style={{
              backfaceVisibility: "hidden",
              transform: "translateZ(2px)",
            }}
          >
            <Image
              key={frontImage}
              src={frontImage}
              alt="NFC Review Card Front"
              fill
              className="object-cover"
              priority
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(${135 + renderRotation.y * 0.3}deg, 
                  rgba(255,255,255,0.08) 0%, 
                  transparent 30%, 
                  transparent 70%, 
                  rgba(0,0,0,0.3) 100%)`,
                mixBlendMode: "overlay",
              }}
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${50 + Math.sin(renderRotation.y * Math.PI / 180) * 20}% ${50 + Math.cos(renderRotation.y * Math.PI / 180) * 20}%, 
                  rgba(255,255,255,0.06) 0%, 
                  transparent 50%)`,
              }}
            />
          </div>

          <div
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(2px)",
            }}
          >
            <Image
              key={backImage}
              src={backImage}
              alt="NFC Review Card Back"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(${135 + (renderRotation.y + 180) * 0.3}deg, 
                  rgba(255,255,255,0.08) 0%, 
                  transparent 30%, 
                  transparent 70%, 
                  rgba(0,0,0,0.3) 100%)`,
                mixBlendMode: "overlay",
              }}
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${50 - Math.sin(renderRotation.y * Math.PI / 180) * 20}% ${50 - Math.cos(renderRotation.y * Math.PI / 180) * 20}%, 
                  rgba(255,255,255,0.06) 0%, 
                  transparent 50%)`,
              }}
            />
          </div>
        </div>

        <div 
          className="absolute -bottom-6 h-10 rounded-full bg-black/80 blur-2xl"
          style={{
            left: `${50 + Math.sin(renderRotation.y * Math.PI / 180) * 15}%`,
            right: `${50 - Math.sin(renderRotation.y * Math.PI / 180) * 15}%`,
            opacity: 0.6 + Math.abs(Math.sin(renderRotation.y * Math.PI / 180)) * 0.2,
            transform: `translateX(${Math.sin(renderRotation.y * Math.PI / 180) * 20}px) scale(${1 + Math.abs(Math.sin(renderRotation.y * Math.PI / 180)) * 0.3})`,
          }}
        />
      </div>
      </div>
    </div>
  );
}

