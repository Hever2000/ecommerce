'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
}

export default function Section({ children, className, id, dark }: SectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className={clsx(
        'py-20 lg:py-32',
        dark && 'bg-brand text-cream-50',
        className
      )}
    >
      {children}
    </motion.section>
  );
}
