import { useState } from 'react'
import { supabase } from '../supabase'

export default function SetupPage() {
  const [step, setStep] = useState('competition')
  const [compName, setCompName] = useState('')
  const [compPassword, setCompPassword] = useState('')
  const [compLoading, setCompLoading] = useState(false)
  const [compError, setCompError] = useState('')
  const [competition, setCompetition] = useState(null)

  const [categories, setCategories] = useState([])
  const [catName, setCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')

  async function createCompetition(e) {
    e.preventDefault()
    if (!compName.trim() || !compPassword.trim()) return
    setCompLoading(true)
    setCompError('')
    const { data, error } = await supabase
      .from('competitions')
      .insert({ name: compName.trim(), password: compPassword.trim() })
      .select()
      .single()
    setCompLoading(false)
    if (error) { setCompError(error.message); return }
    setCompetition(data)
    setStep('setup')
  }

  async function addCategory(e) {
    e.preventDefault()
    if (!catName.trim()) return
    setCatLoading(true)
    setCatError('')
    const { data, error } = await supabase
      .from('categories')
      .insert({ competition_id: competition.id, name: catName.trim() })
      .select()
      .single()
    setCatLoading(false)
    if (error) { setCatError(error.message); return }
    setCategories(prev => [...prev, { ...data, tracks: [] }])
    setCatName('')
  }

  function updateCategory(catId, updated) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, ...updated } : c))
  }

  if (step === 'competition') {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Judgerly &mdash; Setup</h1>
        </div>
        <div className="card">
          <h2>Create Competition</h2>
          <form onSubmit={createCompetition}>
            <div className="mb-sm">
              <input className="input" placeholder="Competition name" value={compName} onChange={e => setCompName(e.target.value)} />
            </div>
            <div className="mb-sm">
              <input className="input" type="password" placeholder="Judge password" value={compPassword} onChange={e => setCompPassword(e.target.value)} />
            </div>
            {compError && <p className="error">{compError}</p>}
            <button className="btn mt-sm" type="submit" disabled={compLoading}>
              {compLoading ? <span className="loading">Creating</span> : 'Create Competition'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Judgerly &mdash; Setup</h1>
      </div>
      <div className="card">
        <p className="bold">{competition.name}</p>
        <p className="muted mt-sm">Competition ID: <code>{competition.id}</code></p>
        <p className="success mt-sm">Competition created successfully</p>
      </div>

      <div className="section">
        <h2>Categories</h2>
        <form onSubmit={addCategory} className="row mb-md">
          <input className="input flex-1" placeholder="Category name" value={catName} onChange={e => setCatName(e.target.value)} />
          <button className="btn" type="submit" disabled={catLoading}>
            {catLoading ? '...' : 'Add Category'}
          </button>
        </form>
        {catError && <p className="error">{catError}</p>}

        {categories.map(cat => (
          <CategorySection key={cat.id} category={cat} onUpdate={updated => updateCategory(cat.id, updated)} />
        ))}
      </div>

      <div className="card">
        <p className="bold">Setup Complete</p>
        <p className="muted mt-sm">Share your competition ID with judges:</p>
        <p className="mt-sm bold" style={{ fontSize: '1.1rem' }}>{competition.id}</p>
        <p className="muted mt-sm">Judges go to <strong>/judge</strong> and enter the password: <strong>{competition.password}</strong></p>
      </div>
    </div>
  )
}

function CategorySection({ category, onUpdate }) {
  const [trackName, setTrackName] = useState('')
  const [criteria, setCriteria] = useState([{ name: '', weight: 100 }])
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState('')

  const totalWeight = criteria.reduce((s, c) => s + Number(c.weight || 0), 0)

  function addCriterion() {
    setCriteria(prev => [...prev, { name: '', weight: 0 }])
  }

  function removeCriterion(i) {
    setCriteria(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateCriterion(i, field, value) {
    setCriteria(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: field === 'weight' ? Number(value) : value } : c))
  }

  async function addTrack(e) {
    e.preventDefault()
    if (!trackName.trim()) return
    if (criteria.some(c => !c.name.trim())) { setTrackError('All criteria must have names'); return }
    setTrackLoading(true)
    setTrackError('')
    const { data, error } = await supabase
      .from('tracks')
      .insert({ category_id: category.id, name: trackName.trim(), criteria })
      .select()
      .single()
    setTrackLoading(false)
    if (error) { setTrackError(error.message); return }
    onUpdate({ tracks: [...(category.tracks || []), { ...data, participants: [] }] })
    setTrackName('')
    setCriteria([{ name: '', weight: 100 }])
  }

  return (
    <div className="card">
      <h3>{category.name}</h3>

      <div className="section mt-md">
        <h3>Add Track</h3>
        <form onSubmit={addTrack}>
          <div className="mb-sm">
            <input className="input" placeholder="Track name" value={trackName} onChange={e => setTrackName(e.target.value)} />
          </div>
          <div className="mb-sm">
            <p className="muted mb-sm">
              Criteria (total weight:{' '}
              <strong style={{ color: totalWeight === 100 ? '#16a34a' : '#dc2626' }}>{totalWeight}%</strong>
              {totalWeight !== 100 && <span className="error"> &mdash; must equal 100</span>})
            </p>
            {criteria.map((c, i) => (
              <div key={i} className="row mb-sm">
                <input className="input flex-1" placeholder="Criterion name" value={c.name} onChange={e => updateCriterion(i, 'name', e.target.value)} />
                <input className="input" style={{ width: '80px' }} type="number" min="0" max="100" placeholder="Wt%" value={c.weight} onChange={e => updateCriterion(i, 'weight', e.target.value)} />
                {criteria.length > 1 && <button type="button" className="btn-outline btn-sm" onClick={() => removeCriterion(i)}>&times;</button>}
              </div>
            ))}
            <button type="button" className="btn-outline btn-sm" onClick={addCriterion}>+ Add Criterion</button>
          </div>
          {trackError && <p className="error">{trackError}</p>}
          <button className="btn mt-sm" type="submit" disabled={trackLoading || totalWeight !== 100}>
            {trackLoading ? '...' : 'Add Track'}
          </button>
        </form>
      </div>

      {(category.tracks || []).map(track => (
        <TrackSection key={track.id} track={track} onUpdate={updated => {
          onUpdate({ tracks: (category.tracks || []).map(t => t.id === track.id ? { ...t, ...updated } : t) })
        }} />
      ))}
    </div>
  )
}

function TrackSection({ track, onUpdate }) {
  const [participantName, setParticipantName] = useState('')
  const [pLoading, setPLoading] = useState(false)
  const [pError, setPError] = useState('')

  async function addParticipant(e) {
    e.preventDefault()
    if (!participantName.trim()) return
    setPLoading(true)
    setPError('')
    const { data, error } = await supabase
      .from('participants')
      .insert({ track_id: track.id, name: participantName.trim() })
      .select()
      .single()
    setPLoading(false)
    if (error) { setPError(error.message); return }
    onUpdate({ participants: [...(track.participants || []), data] })
    setParticipantName('')
  }

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
      <p className="bold">{track.name}</p>
      <p className="muted" style={{ fontSize: '0.8rem' }}>Criteria: {track.criteria.map(c => `${c.name} (${c.weight}%)`).join(', ')}</p>

      <form onSubmit={addParticipant} className="row mt-sm mb-sm">
        <input className="input flex-1" placeholder="Participant name" value={participantName} onChange={e => setParticipantName(e.target.value)} />
        <button className="btn btn-sm" type="submit" disabled={pLoading}>{pLoading ? '...' : 'Add'}</button>
      </form>
      {pError && <p className="error">{pError}</p>}

      {(track.participants || []).length > 0 && (
        <ul style={{ paddingLeft: '1rem', fontSize: '0.9rem' }}>
          {(track.participants || []).map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
      )}
    </div>
  )
}
