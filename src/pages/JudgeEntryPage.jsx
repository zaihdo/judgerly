import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function JudgeEntryPage() {
  const navigate = useNavigate()
  const [judgeName, setJudgeName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('judge_name')
    if (saved) setJudgeName(saved)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!judgeName.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    const { data, error: qError } = await supabase
      .from('competitions')
      .select('id')
      .eq('password', password.trim())
      .single()
    setLoading(false)
    if (qError || !data) { setError('Invalid password. Please try again.'); return }
    localStorage.setItem('judge_name', judgeName.trim())
    navigate(`/judge/${data.id}`)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1> Judge Login</h1>Judgerly 
      </div>
      <div className="card">
        <h2>Enter Your Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-sm">
            <input
              className="input"
              placeholder="Your name"
              value={judgeName}
              onChange={e => setJudgeName(e.target.value)}
            />
          </div>
          <div className="mb-sm">
            <input
              className="input"
              type="password"
              placeholder="Competition password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn mt-sm" type="submit" disabled={loading}>
            {loading ? <span className="loading">Verifying</span> : 'Enter Competition'}
          </button>
        </form>
      </div>
    </div>
  )
}
