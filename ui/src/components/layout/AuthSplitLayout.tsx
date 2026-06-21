import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { ROUTES } from '@/utils'

interface FeedEntry {
  id: number
  emoji: string
  dot: string
  title: string
}

const POOL: Omit<FeedEntry, 'id'>[] = [
  { emoji: '🚀', dot: '#34d399', title: 'Auth flow live'                   },
  { emoji: '🔨', dot: '#7c6fe0', title: 'Wiring agent tokens'               },
  { emoji: '🌱', dot: '#2dd4bf', title: 'Docs → narrative logs'             },
  { emoji: '⚡', dot: '#fde047', title: 'The log IS the product'            },
  { emoji: '🪨', dot: '#fbbf24', title: 'SSE behind JWT blocked'            },
  { emoji: '🌊', dot: '#60a5fa', title: 'Stepped back, reconsidered scope'  },
  { emoji: '🚀', dot: '#34d399', title: 'Public profiles shipped'           },
  { emoji: '🔨', dot: '#7c6fe0', title: 'Realtime feed prototype'           },
  { emoji: '🌱', dot: '#2dd4bf', title: 'Finally grokked SSE backpressure'  },
  { emoji: '⚡', dot: '#fde047', title: 'Mood system clicked into place'    },
  { emoji: '🚀', dot: '#34d399', title: 'Deploy pipeline green'             },
  { emoji: '🪨', dot: '#fbbf24', title: 'Rate limiter eating agent calls'   },
  { emoji: '🌊', dot: '#60a5fa', title: 'Rewrote the schema, felt right'    },
  { emoji: '🌱', dot: '#2dd4bf', title: 'Tests finally passing'             },
  { emoji: '⚡', dot: '#fde047', title: 'One line fix, hours of context'    },
]

let uid = 0
function nextEntry(index: number): FeedEntry {
  return { id: uid++, ...POOL[index % POOL.length] }
}

interface AuthSplitLayoutProps {
  children: React.ReactNode
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const [feed, setFeed] = useState<FeedEntry[]>(() =>
    Array.from({ length: 5 }, (_, i) => nextEntry(i)),
  )
  const poolIndexRef = useRef(5)

  useEffect(() => {
    const timer = setInterval(() => {
      const entry = nextEntry(poolIndexRef.current)
      poolIndexRef.current = (poolIndexRef.current + 1) % POOL.length
      setFeed((prev) => [entry, ...prev.slice(0, 4)])
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-surface-950 md:flex">
      {/* ── Left panel ────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] md:flex md:w-[42%] md:flex-col md:justify-between md:p-10 lg:w-[40%]">
        {/* ambient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_20%,rgba(124,111,224,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_20%_30%,black,transparent)]" />
        </div>

        {/* Logo */}
        <Link to={ROUTES.HOME} className="relative z-10 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
            <Radio className="h-4 w-4 text-accent-light" />
          </div>
          <span className="text-title text-ink-primary">devLog</span>
        </Link>

        {/* Live timeline feed */}
        <div className="relative z-10 my-8 flex flex-1 flex-col justify-center overflow-hidden">
          <div className="absolute bottom-0 left-[5px] top-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />

          <div className="space-y-2 pl-6">
            <AnimatePresence initial={false}>
              {feed.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <span
                    className="absolute -left-[1.35rem] top-[0.65rem] h-2 w-2 rounded-full"
                    style={{ background: entry.dot, boxShadow: `0 0 8px ${entry.dot}99` }}
                  />
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[11px]">{entry.emoji}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-ink-disabled">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        just now
                      </span>
                    </div>
                    <p className="text-[0.8rem] font-medium leading-snug text-ink-secondary">{entry.title}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Tagline */}
        <p className="relative z-10 font-mono text-caption text-ink-disabled">
          The build journal that writes itself.
        </p>
      </div>

      {/* ── Right panel (form) ────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <Link to={ROUTES.HOME} className="mb-8 flex items-center gap-2 md:hidden">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04]">
            <Radio className="h-3.5 w-3.5 text-accent-light" />
          </div>
          <span className="text-title text-ink-primary">devLog</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
