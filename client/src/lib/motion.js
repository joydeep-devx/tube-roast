// Shared animation presets so every section moves with the same rhythm.

const easeOut = [0.22, 1, 0.36, 1]

// Parent that reveals its children one after another.
export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
})

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
}

export const fadeUpScale = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: easeOut } },
}

// Spread onto a motion element to animate it the first time it scrolls into view.
export const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.25 },
}

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
}
