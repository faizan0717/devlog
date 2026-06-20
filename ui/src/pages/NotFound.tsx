import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import { Button } from '@/components/ui'
import { ROUTES } from '@/utils'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-8">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center"
      >
        <p className="text-label uppercase text-accent tracking-widest mb-4">404</p>
        <h1 className="text-headline text-ink-primary mb-3">Page not found.</h1>
        <p className="text-body text-ink-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link to={ROUTES.HOME}>
          <Button variant="secondary">Go home</Button>
        </Link>
      </motion.div>
    </div>
  )
}
