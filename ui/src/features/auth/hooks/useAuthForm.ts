import { useState } from 'react'

export function useAuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return {
    email, setEmail,
    password, setPassword,
    username, setUsername,
    error, setError,
    loading, setLoading,
  }
}
