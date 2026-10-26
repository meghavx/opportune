import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { APP_NAME } from './config/appConfig'

// Application entry point. Wraps the App in BrowserRouter so that
// React Router DOM v7 routing works throughout the application.
document.title = APP_NAME

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
