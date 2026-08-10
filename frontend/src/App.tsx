import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { WarehousesPage } from './pages/WarehousesPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
