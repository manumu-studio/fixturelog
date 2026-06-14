// TechBadges.tsx — staggered tech stack badge band with cyan accents.
// whileInView stagger reveal via motion/react-client; reduced-motion safe
// (motion respects prefers-reduced-motion by default).

'use client';

import * as motion from 'motion/react-client';
import { LANDING_TECH_BADGES } from '@/lib/constants/landing-copy';
import type { TechBadgesProps } from './TechBadges.types';
import styles from './TechBadges.module.css';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
} as const;

const badgeVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.215, 0.61, 0.355, 1] },
  },
} as const;

export function TechBadges({ className }: TechBadgesProps) {
  return (
    <section
      className={[styles.section, className].filter(Boolean).join(' ')}
      aria-label="Technology stack"
    >
      <div className={styles.inner}>
        <h2 className={styles.eyebrow}>Built with</h2>

        <motion.ul
          className={styles.badges}
          role="list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {LANDING_TECH_BADGES.map((badge) => (
            <motion.li
              key={badge.label}
              className={styles.badge}
              variants={badgeVariants}
            >
              {badge.label}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
