import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import App from './App.jsx'
import './styles/index.css'

// Lazy load AdminPage (sadece /admin route'unda yüklenecek)
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
