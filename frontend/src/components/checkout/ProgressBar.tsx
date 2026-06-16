'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  steps: { number: number; label: string }[];
  completedSteps: Set<number>;
}

export default function ProgressBar({ steps, completedSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.number);
        const nextIncomplete = steps.find((s) => !completedSteps.has(s.number));
        const isActive = step.number === (nextIncomplete?.number ?? steps.length);

        let stateLabel: string;
        let stateClass: string;
        let circleClass: string;
        let labelClass: string;
        let subClass: string;

        if (isCompleted) {
          stateLabel = 'Completado';
          stateClass = 'text-accent';
          circleClass = 'border-ink bg-ink text-cream-50';
          labelClass = 'text-ink';
          subClass = 'text-accent';
        } else if (isActive) {
          stateLabel = 'En progreso';
          stateClass = 'text-ink-lighter';
          circleClass = 'border-ink text-ink';
          labelClass = 'text-ink';
          subClass = 'text-ink-lighter';
        } else {
          stateLabel = 'Pendiente';
          stateClass = 'text-cream-300';
          circleClass = 'border-cream-300 text-ink-lighter';
          labelClass = 'text-ink-lighter';
          subClass = 'text-cream-300';
        }

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-500',
                  circleClass
                )}
              >
                {isCompleted ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  step.number
                )}
              </motion.div>
              <span
                className={clsx(
                  'mt-2 text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300',
                  labelClass
                )}
              >
                {step.label}
              </span>
              <span
                className={clsx(
                  'mt-0.5 text-[9px] uppercase tracking-wider transition-colors duration-300',
                  subClass
                )}
              >
                {stateLabel}
              </span>
            </div>
            {index < steps.length - 1 && (
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted
                    ? 'rgb(26, 26, 26)'
                    : 'rgb(212, 208, 191)',
                }}
                transition={{ duration: 0.5 }}
                className="mx-3 h-px w-12 sm:mx-4 sm:w-20"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
