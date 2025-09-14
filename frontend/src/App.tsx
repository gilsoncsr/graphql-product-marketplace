import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/api/apolloClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { setupErrorHandling } from '@/utils/logger';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ProductsList } from '@/pages/products/ProductsList';
import { ProductDetail } from '@/pages/products/ProductDetail';
import { CartPage } from '@/pages/cart/CartPage';
import { OrdersList } from '@/pages/orders/OrdersList';
import { OrderDetail } from '@/pages/orders/OrderDetail';
import './App.scss';

function App() {
  // Configurar captura de erros globais
  useEffect(() => {
    setupErrorHandling();
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="app">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersList />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
