'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ElementType, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: ElementType;
  id?: string;
  blur?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function FadeUp({
  children,
  delay = 0,
  className,
  as = 'div',
  id,
  blur = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      ref={ref as any}
      id={id}
      className={className}
      initial={blur ? { opacity: 0, y: 24, filter: 'blur(4px)' } : { opacity: 0, y: 24 }}
      animate={
        inView
          ? blur
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : { opacity: 1, y: 0 }
          : undefined
      }
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}
