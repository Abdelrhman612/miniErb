import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { WarehouseDetailsPage } from './pages/WarehouseDetailsPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchaseInvoicesPage } from './pages/PurchaseInvoicesPage';
import { SalesInvoicesPage } from './pages/SalesInvoicesPage';
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
          <Route path="/warehouses/:id" element={<WarehouseDetailsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/purchase-invoices" element={<PurchaseInvoicesPage />} />
          <Route path="/sales/invoices" element={<SalesInvoicesPage />} />
          <Route path="/sales-invoices" element={<SalesInvoicesPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
