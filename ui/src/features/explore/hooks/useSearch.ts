import { useState, useEffect, useRef, useCallback } from 'react'
import { exploreService } from '@/services/explore.service'
import type { SearchResults, AsyncState } from '@/types'

const EMPTY: SearchResults = { projects: [], users: [], logs: [] }

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AsyncState<SearchResults>>({
    data: EMPTY, loading: false, error: null,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults({ data: EMPTY, loading: false, error: null })
      return
    }
    setResults((s) => ({ ...s, loading: true }))
    timerRef.current = setTimeout(() => {
      exploreService
        .search(query.trim())
        .then((data) => setResults({ data, loading: false, error: null }))
        .catch((err: Error) => setResults({ data: EMPTY, loading: false, error: err.message }))
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const clearQuery = useCallback(() => setQuery(''), [])

  return { query, setQuery, clearQuery, results }
}
