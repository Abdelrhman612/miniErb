import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { WarehouseDetailsPage } from './pages/WarehouseDetailsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierAccountPage } from './pages/SupplierAccountPage';
import { PurchaseInvoicesPage } from './pages/PurchaseInvoicesPage';
import { SalesInvoicesPage } from './pages/SalesInvoicesPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { ReceiptVouchersPage } from './pages/ReceiptVouchersPage';
import { PaymentVouchersPage } from './pages/PaymentVouchersPage';
import { JournalVouchersPage } from './pages/JournalVouchersPage';
import { ChartOfAccountsPage } from './pages/ChartOfAccountsPage';
import { DashboardPage } from './pages/DashboardPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/warehouses" element={<WarehousesPage />} />
          <Route path="/warehouses/:id" element={<WarehouseDetailsPage />} />
          <Route path="/chart-of-accounts" element={<ChartOfAccountsPage />} />
          <Route path="/treasury" element={<TreasuryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id/account" element={<CustomerAccountPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id/account" element={<SupplierAccountPage />} />
          <Route path="/purchase-invoices" element={<PurchaseInvoicesPage />} />
          <Route path="/sales/invoices" element={<SalesInvoicesPage />} />
          <Route path="/sales-invoices" element={<SalesInvoicesPage />} />
          <Route path="/receipt-vouchers" element={<ReceiptVouchersPage />} />
          <Route path="/payment-vouchers" element={<PaymentVouchersPage />} />
          <Route path="/journal-vouchers" element={<JournalVouchersPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
