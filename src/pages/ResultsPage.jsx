import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import Nav from '../components/Nav'

export default function ResultsPage() {
  const { competitionId } = useParams()
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(`results_auth_${competitionId}`))
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [competition, setCompetition] = useState(null)
  const [categories, setCategories] = useState([])
  const [allScores, setAllScores] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null)

  async function handleAuth(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    const { data, error } = await supabase
      .from('competitions')
      .select('id, name')
      .eq('id', competitionId)
      .eq('password', password.trim())
      .single()
    setAuthLoading(false)
    if (error || !data) { setAuthError('Invalid password.'); return }
    sessionStorage.setItem(`results_auth_${competitionId}`, '1')
    setAuthed(true)
  }

  const loadData = useCallback(async () => {
    if (!authed) return
    setLoading(true)

    const { data: comp } = await supabase.from('competitions').select('*').eq('id', competitionId).single()
    setCompetition(comp)

    const { data: cats, error: catErr } = await supabase.from('categories').select('*').eq('competition_id', competitionId)
    if (catErr) { console.error('categories:', catErr); setLoading(false); return }
    const catIds = (cats || []).map(c => c.id)

    const { data: tracks, error: trackErr } = await supabase.from('tracks').select('*').in('category_id', catIds.length ? catIds : [''])
    if (trackErr) { console.error('tracks:', trackErr); setLoading(false); return }
    const trackIds = (tracks || []).map(t => t.id)

    const { data: participants, error: partErr } = await supabase.from('participants').select('*').in('track_id', trackIds.length ? trackIds : [''])
    if (partErr) { console.error('participants:', partErr); setLoading(false); return }
    const pIds = (participants || []).map(p => p.id)

    const { data: scores, error: scoresErr } = await supabase.from('scores').select('*').in('participant_id', pIds.length ? pIds : [''])
    if (scoresErr) { console.error('scores:', scoresErr) }
    setAllScores(scores || [])

    const structured = (cats || []).map(cat => ({
      ...cat,
      tracks: (tracks || []).filter(t => t.category_id === cat.id).map(track => ({
        ...track,
        participants: (participants || []).filter(p => p.track_id === track.id)
      }))
    }))
    setCategories(structured)
    setSelectedCat(prev => prev ?? (structured.length ? structured[0].id : null))
    setLoading(false)
  }, [authed, competitionId])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!authed) return
    const channel = supabase.channel('results-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [authed, loadData])

  if (!authed) {
    return (
      <>
        <Nav />
        <div className="container">
        <div className="page-header"><h1>Judgerly &mdash; Results</h1></div>
        <div className="card">
          <h2>Enter Competition Password</h2>
          <form onSubmit={handleAuth}>
            <input className="input mb-sm" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            {authError && <p className="error">{authError}</p>}
            <button className="btn mt-sm" type="submit" disabled={authLoading}>
              {authLoading ? <span className="loading">Verifying</span> : 'View Results'}
            </button>
          </form>
        </div>
        </div>
      </>
    )
  }

  if (loading) return <><Nav /><div className="container"><p className="loading mt-md">Loading results</p></div></>

  const currentCat = categories.find(c => c.id === selectedCat)
  const currentTrack = currentCat?.tracks?.find(t => t.id === selectedTrack) || currentCat?.tracks?.[0]

  const uniqueJudges = [...new Set(allScores.map(s => s.judge_name).filter(Boolean))]

  function getLeaderboard(track) {
    if (!track) return []
    return track.participants.map(p => {
      const pScores = allScores.filter(s => s.participant_id === p.id)
      const avg = pScores.length
        ? pScores.reduce((sum, s) => sum + (s.weighted_total || 0), 0) / pScores.length
        : null
      return { ...p, avg, judgeCount: pScores.length }
    }).filter(p => p.avg !== null).sort((a, b) => b.avg - a.avg)
  }

  function getJudgeBreakdown(track) {
    if (!track) return { judges: [], rows: [] }
    const trackScores = allScores.filter(s => track.participants.some(p => p.id === s.participant_id))
    const judges = [...new Set(trackScores.map(s => s.judge_name))]
    const rows = track.participants.map(p => {
      const judgeScores = {}
      judges.forEach(j => {
        const s = trackScores.find(sc => sc.participant_id === p.id && sc.judge_name === j)
        judgeScores[j] = s ? s.weighted_total : null
      })
      return { ...p, judgeScores }
    })
    return { judges, rows }
  }

  const leaderboard = getLeaderboard(currentTrack)
  const { judges: breakdownJudges, rows: breakdownRows } = getJudgeBreakdown(currentTrack)

  return (
    <>
      <Nav />
      <div className="container">
      <div className="page-header">
        <h1>{competition?.name || 'Results'}</h1>
        <p style={{ color: '#e0dfff', fontSize: '0.9rem' }}>{uniqueJudges.length} judge(s) submitted scores</p>
      </div>

      <div className="section">
        <p className="muted mb-sm">Category</p>
        <div className="tab-bar">
          {categories.map(cat => (
            <button key={cat.id} className={`tab${selectedCat === cat.id ? ' active' : ''}`} onClick={() => { setSelectedCat(cat.id); setSelectedTrack(null) }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {currentCat && (
        <div className="section">
          <p className="muted mb-sm">Track</p>
          <div className="tab-bar">
            {currentCat.tracks.map(track => (
              <button key={track.id} className={`tab${(selectedTrack || currentCat.tracks[0]?.id) === track.id ? ' active' : ''}`} onClick={() => setSelectedTrack(track.id)}>
                {track.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentTrack && (
        <>
          <div className="card">
            <h2>Leaderboard &mdash; {currentTrack.name}</h2>
            {leaderboard.length === 0 ? (
              <p className="muted">No scores submitted yet.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Rank</th><th>Participant</th><th>Avg Score</th><th>Judges</th></tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => (
                    <tr key={p.id} className={i === 0 ? 'rank-1' : ''}>
                      <td>{i + 1}</td>
                      <td>{p.name}</td>
                      <td>{p.avg.toFixed(2)}</td>
                      <td>{p.judgeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {breakdownJudges.length > 0 && (
            <div className="card" style={{ overflowX: 'auto' }}>
              <h2>Per-Judge Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Participant</th>
                    {breakdownJudges.map(j => <th key={j}>{j}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      {breakdownJudges.map(j => (
                        <td key={j}>{p.judgeScores[j] != null ? p.judgeScores[j].toFixed(2) : '\u2014'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </div>
    </>
  )
}
