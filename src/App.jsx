import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SetupPage from './pages/SetupPage'
import JudgeEntryPage from './pages/JudgeEntryPage'
import JudgeScoringPage from './pages/JudgeScoringPage'
import ResultsPage from './pages/ResultsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/judge" element={<JudgeEntryPage />} />
        <Route path="/judge/:competitionId" element={<JudgeScoringPage />} />
        <Route path="/results/:competitionId" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
