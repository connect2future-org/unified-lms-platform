import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export const useSettings = (area) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!area) return

    setLoading(true)
    setError('')

    fetch(`/api/settings/${area}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [area])

  const create = async (payload) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/settings/${area}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } finally {
      setLoading(false)
    }
  }

  const update = async (id, payload) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/settings/${area}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/settings/${area}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, create, update, remove }
}
