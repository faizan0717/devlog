import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { Button } from '@/components/ui'
import { ROUTES } from '@/utils'

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 text-center max-w-2xl"
      >
        <motion.p
          variants={fadeUp}
          custom={0}
          className="text-label uppercase text-accent tracking-widest mb-6"
        >
          devLog
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="text-display text-gradient mb-6"
        >
          Document what you&apos;re building.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-body text-ink-secondary mb-10 max-w-md mx-auto"
        >
          A cinematic timeline platform for makers. Journal your projects,
          track milestones, and share your progress with the world.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4">
          <Link to={ROUTES.REGISTER}>
            <Button size="lg">Get started</Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="ghost" size="lg">Sign in</Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
