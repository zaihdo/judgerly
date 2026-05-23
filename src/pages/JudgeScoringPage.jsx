import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export default function JudgeScoringPage() {
  const { competitionId } = useParams()
  const judgeName = localStorage.getItem('judge_name') || ''

  const [competition, setCompetition] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedCat, setSelectedCat] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [scoredMap, setScoredMap] = useState({})

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: comp, error: cErr } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single()
    if (cErr) { setError(cErr.message); setLoading(false); return }
    setCompetition(comp)

    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('competition_id', competitionId)
    if (catErr) { setError('Failed to load categories: ' + catErr.message); setLoading(false); return }

    const catIds = (cats || []).map(c => c.id)
    const { data: tracks, error: trackErr } = await supabase
      .from('tracks')
      .select('*')
      .in('category_id', catIds.length ? catIds : [''])
    if (trackErr) { setError('Failed to load tracks: ' + trackErr.message); setLoading(false); return }

    const trackIds = (tracks || []).map(t => t.id)
    const { data: participants, error: partErr } = await supabase
      .from('participants')
      .select('*')
      .in('track_id', trackIds.length ? trackIds : [''])
    if (partErr) { setError('Failed to load participants: ' + partErr.message); setLoading(false); return }

    const allParticipantIds = (participants || []).map(p => p.id)
    let scoresData = []
    if (allParticipantIds.length && judgeName) {
      const { data: sd } = await supabase
        .from('scores')
        .select('*')
        .in('participant_id', allParticipantIds)
        .eq('judge_name', judgeName)
      scoresData = sd || []
    }

    const sm = {}
    scoresData.forEach(s => { sm[s.participant_id] = s })
    setScoredMap(sm)

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
  }, [competitionId, judgeName])

  useEffect(() => { loadData() }, [competitionId, judgeName])

  useEffect(() => {
    const channel = supabase.channel('scores-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        loadData()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadData])

  const currentCat = categories.find(c => c.id === selectedCat)
  const currentTrack = currentCat?.tracks?.find(t => t.id === selectedTrack) || currentCat?.tracks?.[0]

  useEffect(() => {
    if (currentCat?.tracks?.length && !selectedTrack) {
      setSelectedTrack(currentCat.tracks[0].id)
    }
  }, [currentCat, selectedTrack])

  function handleCatSelect(catId) {
    setSelectedCat(catId)
    setSelectedTrack(null)
    setSelectedParticipant(null)
  }

  function handleTrackSelect(trackId) {
    setSelectedTrack(trackId)
    setSelectedParticipant(null)
  }

  function handleScoreSubmitted(participantId, scoreRow) {
    setScoredMap(prev => ({ ...prev, [participantId]: scoreRow }))
    if (currentTrack) {
      const idx = currentTrack.participants.findIndex(p => p.id === participantId)
      const next = currentTrack.participants.slice(idx + 1).find(p => !scoredMap[p.id])
      if (next) setTimeout(() => setSelectedParticipant(next.id), 1500)
      else setTimeout(() => setSelectedParticipant(null), 1500)
    }
  }

  if (loading) return <div className="container"><p className="loading mt-md">Loading</p></div>
  if (error) return <div className="container"><p className="error mt-md">{error}</p></div>

  const trackParticipants = currentTrack?.participants || []
  const scoredCount = trackParticipants.filter(p => scoredMap[p.id]).length

  return (
    <div className="container">
      <div className="page-header">
        <h1>{competition?.name}</h1>
        <p style={{ color: '#e0dfff', fontSize: '0.9rem' }}>Judge: {judgeName}</p>
      </div>

      <div className="section">
        <p className="muted mb-sm">Category</p>
        <div className="tab-bar">
          {categories.map(cat => (
            <button key={cat.id} className={`tab${selectedCat === cat.id ? ' active' : ''}`} onClick={() => handleCatSelect(cat.id)}>
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
              <button key={track.id} className={`tab${(selectedTrack || currentCat.tracks[0]?.id) === track.id ? ' active' : ''}`} onClick={() => handleTrackSelect(track.id)}>
                {track.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentTrack && (
        <div className="section">
          <div className="flex justify-between items-center mb-sm">
            <h2>{currentTrack.name}</h2>
            <span className="muted">{scoredCount} / {trackParticipants.length} scored</span>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {trackParticipants.map(p => (
              <div
                key={p.id}
                className={`participant-row${selectedParticipant === p.id ? ' active' : ''}`}
                onClick={() => setSelectedParticipant(prev => prev === p.id ? null : p.id)}
              >
                <span>{p.name}</span>
                {scoredMap[p.id] && <span className="checkmark">&#10003;</span>}
              </div>
            ))}
            {trackParticipants.length === 0 && <p className="muted" style={{ padding: '1rem' }}>No participants in this track.</p>}
          </div>

          {selectedParticipant && (() => {
            const participant = trackParticipants.find(p => p.id === selectedParticipant)
            if (!participant) return null
            return (
              <ScoringForm
                key={selectedParticipant}
                participant={participant}
                criteria={currentTrack.criteria}
                judgeName={judgeName}
                existingScore={scoredMap[selectedParticipant]}
                onSubmitted={scoreRow => handleScoreSubmitted(selectedParticipant, scoreRow)}
              />
            )
          })()}
        </div>
      )}
    </div>
  )
}

function ScoringForm({ participant, criteria, judgeName, existingScore, onSubmitted }) {
  const [scores, setScores] = useState(() => {
    const init = {}
    criteria.forEach(c => { init[c.name] = existingScore?.scores?.[c.name] ?? 5 })
    return init
  })
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const weightedTotal = criteria.reduce((sum, c) => sum + (scores[c.name] || 0) * (c.weight / 100), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const scoresJsonb = {}
    criteria.forEach(c => { scoresJsonb[c.name] = scores[c.name] })
    const { data, error: err } = await supabase
      .from('scores')
      .upsert(
        { participant_id: participant.id, judge_name: judgeName, scores: scoresJsonb, weighted_total: Math.round(weightedTotal * 100) / 100 },
        { onConflict: 'participant_id,judge_name' }
      )
      .select()
      .single()
    setSubmitting(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    onSubmitted(data)
  }

  return (
    <div className="card mt-md">
      <h3>Scoring: {participant.name}</h3>
      <form onSubmit={handleSubmit}>
        {criteria.map(c => (
          <div key={c.name} className="mb-md">
            <div className="flex justify-between mb-sm">
              <span className="bold">{c.name}</span>
              <span className="muted">{c.weight}% &middot; Score: <strong>{scores[c.name]}</strong></span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={scores[c.name]}
              onChange={e => setScores(prev => ({ ...prev, [c.name]: parseFloat(e.target.value) }))}
              style={{ width: '100%', accentColor: 'var(--purple)' }}
            />
            <div className="flex justify-between muted" style={{ fontSize: '0.75rem' }}>
              <span>0</span><span>5</span><span>10</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center mb-sm" style={{ background: '#f0eeff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)' }}>
          <span className="bold">Weighted Total</span>
          <span className="bold" style={{ fontSize: '1.2rem', color: 'var(--purple)' }}>{weightedTotal.toFixed(2)}</span>
        </div>
        {error && <p className="error">{error}</p>}
        {saved && <p className="success">Score saved &#10003;</p>}
        <button className="btn mt-sm" type="submit" disabled={submitting}>
          {submitting ? <span className="loading">Saving</span> : existingScore ? 'Update Score' : 'Submit Score'}
        </button>
      </form>
    </div>
  )
}
