import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.jsx'
import WalletContextProvider from './WalletContextProvider.jsx'

// @solana/web3.js expects a global Buffer in the browser.
window.Buffer = window.Buffer || Buffer

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </StrictMode>,
)
