import { useNavigate, useLocation } from 'react-router-dom'

export default function Nav({ backTo, backLabel }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <nav className="nav-bar">
      {!isHome
        ? <button className="nav-back" onClick={() => navigate(backTo || '/')}>← {backLabel || 'Home'}</button>
        : <span className="nav-brand">⚖ Judgerly</span>
      }
      <div className="nav-links">
        {!isHome && <button className="nav-link" onClick={() => navigate('/')}>Home</button>}
        <button className="nav-link" onClick={() => navigate('/setup')}>+ New Competition</button>
      </div>
    </nav>
  )
}
