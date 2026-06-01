import { Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import BlogTransformerViz from './pages/BlogTransformerViz'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog/transformer-visualization" element={<BlogTransformerViz />} />
    </Routes>
  )
}
