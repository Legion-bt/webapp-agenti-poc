import React, { useState, useEffect } from 'react';
import { store } from './lib/store';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { CommandPalette } from './components/common/CommandPalette';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomersView } from './components/customers/CustomersView';
import { CustomerDetailView } from './components/customers/CustomerDetailView';
import { CatalogView } from './components/catalog/CatalogView';
import { ProductDetailView } from './components/catalog/ProductDetailView';
import { OrdersView } from './components/orders/OrdersView';
import { NewOrderView } from './components/orders/NewOrderView';
import { OrderDetailView } from './components/orders/OrderDetailView';
import { QuotesView } from './components/quotes/QuotesView';
import { SuspendedView } from './components/suspended/SuspendedView';
import { VisitsView } from './components/visits/VisitsView';
import { CommissionsView } from './components/commissions/CommissionsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AdminErpView } from './components/admin/AdminErpView';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Re-render when store updates
  const [, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const state = store.getState();

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    setSelectedEntityId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is logged out, show LoginView
  if (!state.isAuthenticated) {
    return (
      <LoginView
        onSuccess={() => {
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenCommand={() => setIsCommandOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-12">
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}

          {currentView === 'customers' && (
            <CustomersView onNavigate={handleNavigate} />
          )}

          {currentView === 'customer-detail' && selectedEntityId && (
            <CustomerDetailView
              customerId={selectedEntityId}
              onNavigate={handleNavigate}
              onBack={() => handleNavigate('customers')}
            />
          )}

          {currentView === 'catalog' && (
            <CatalogView
              onNavigate={handleNavigate}
              onAddToCart={() => handleNavigate('new-order')}
            />
          )}

          {currentView === 'product-detail' && selectedEntityId && (
            <ProductDetailView
              productId={selectedEntityId}
              onNavigate={handleNavigate}
              onBack={() => handleNavigate('catalog')}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView onNavigate={handleNavigate} />
          )}

          {currentView === 'new-order' && (
            <NewOrderView
              initialCustomerId={selectedEntityId}
              onNavigate={handleNavigate}
              onBack={() => handleNavigate('orders')}
            />
          )}

          {currentView === 'order-detail' && selectedEntityId && (
            <OrderDetailView
              orderId={selectedEntityId}
              onNavigate={handleNavigate}
              onBack={() => handleNavigate('orders')}
            />
          )}

          {currentView === 'quotes' && (
            <QuotesView onNavigate={handleNavigate} />
          )}

          {currentView === 'suspended' && (
            <SuspendedView onNavigate={handleNavigate} />
          )}

          {currentView === 'visits' && (
            <VisitsView />
          )}

          {currentView === 'commissions' && (
            <CommissionsView />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'admin-erp' && (
            <AdminErpView />
          )}
        </main>
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <MobileNav
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
