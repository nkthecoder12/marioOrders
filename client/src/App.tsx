import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { DataProvider } from "./context/DataContext";
import { AdminLayout } from "./layouts/AdminLayout";
import { CustomerLayout } from "./layouts/CustomerLayout";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { MenuAdminPage } from "./pages/admin/MenuAdminPage";
import { QueuePage } from "./pages/admin/QueuePage";
import { CartPage } from "./pages/customer/CartPage";
import { MenuPage } from "./pages/customer/MenuPage";
import { MyOrdersPage } from "./pages/customer/MyOrdersPage";
import { OrderStatusPage } from "./pages/customer/OrderStatusPage";
import { PaymentPage } from "./pages/customer/PaymentPage";
import { LoginPage } from "./pages/LoginPage";
import type { Role } from "@shared/types";
import type { ReactNode } from "react";

function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-8 text-center text-sm text-stone-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/menu"} replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        element={
          <Guard role="customer">
            <CartProvider>
              <DataProvider>
                <CustomerLayout />
              </DataProvider>
            </CartProvider>
          </Guard>
        }
      >
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/pay/:id" element={<PaymentPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id" element={<OrderStatusPage />} />
      </Route>
      <Route
        element={
          <Guard role="admin">
            <DataProvider>
              <AdminLayout />
            </DataProvider>
          </Guard>
        }
      >
        <Route path="/admin" element={<QueuePage />} />
        <Route path="/admin/menu" element={<MenuAdminPage />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
