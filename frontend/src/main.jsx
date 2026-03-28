import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { OrderFlowProvider } from './context/OrderFlowContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <OrderFlowProvider>
          <App />
        </OrderFlowProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)
