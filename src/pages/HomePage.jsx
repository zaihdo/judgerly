import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Nav from '../components/Nav'

export default function HomePage() {
  const navigate = useNavigate()
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState(null) // 'judge' | 'results'
  const [judgeName, setJudgeName] = useState(() => localStorage.getItem('judge_name') || '')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('competitions')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
      setLoading(false)
      if (err) { setError(err.message); return }
      setCompetitions(data || [])
    }
    load()
  }, [])

  function handleSelect(comp, selectedMode) {
    setSelected(comp)
    setMode(selectedMode)
    setPassword('')
    setAuthError('')
  }

  async function handleAuth(e) {
    e.preventDefault()
    if (!password.trim()) return
    if (mode === 'judge' && !judgeName.trim()) return
    setAuthLoading(true)
    setAuthError('')
    const { data, error: err } = await supabase
      .from('competitions')
      .select('id')
      .eq('id', selected.id)
      .eq('password', password.trim())
      .single()
    setAuthLoading(false)
    if (err || !data) { setAuthError('Incorrect password.'); return }
    if (mode === 'judge') {
      localStorage.setItem('judge_name', judgeName.trim())
      navigate(`/judge/${selected.id}`)
    } else {
      sessionStorage.setItem(`results_auth_${selected.id}`, '1')
      navigate(`/results/${selected.id}`)
    }
  }

  return (
    <>
      <Nav />
      <div className="container">
        <div className="page-header">
          <h1>Judgerly</h1>
          <p style={{ color: '#e0dfff', fontSize: '0.9rem' }}>Select a competition below</p>
        </div>

        {loading && <p className="loading mt-md">Loading competitions</p>}
        {error && <p className="error mt-md">{error}</p>}
        {!loading && !error && competitions.length === 0 && (
          <p className="muted mt-md">No competitions found. <button className="nav-link" onClick={() => navigate('/setup')}>Create one →</button></p>
        )}

        <div>
          {competitions.map(comp => (
            <div key={comp.id} className={`card${selected?.id === comp.id ? ' selected-card' : ''}`}>
              <div className="bold mb-sm">{comp.name}</div>
              <div className="flex" style={{ gap: '0.5rem' }}>
                <button className="btn btn-sm" onClick={() => handleSelect(comp, 'judge')}>⚖ Judge</button>
                <button className="btn-outline btn-sm" onClick={() => handleSelect(comp, 'results')}>📊 Results</button>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="card mt-md" style={{ borderColor: 'var(--purple)', borderWidth: 2 }}>
            <h2 style={{ marginBottom: '0.25rem' }}>{selected.name}</h2>
            <p className="muted mb-md" style={{ fontSize: '0.85rem' }}>
              {mode === 'judge' ? 'Enter your name and password to start judging.' : 'Enter the competition password to view results.'}
            </p>
            <form onSubmit={handleAuth}>
              {mode === 'judge' && (
                <input
                  className="input mb-sm"
                  placeholder="Your name"
                  value={judgeName}
                  onChange={e => setJudgeName(e.target.value)}
                  required
                />
              )}
              <input
                className="input mb-sm"
                type="password"
                placeholder="Competition password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {authError && <p className="error">{authError}</p>}
              <button className="btn mt-sm" type="submit" disabled={authLoading} style={{ width: '100%' }}>
                {authLoading ? <span className="loading">Verifying</span> : mode === 'judge' ? 'Start Judging →' : 'View Results →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
