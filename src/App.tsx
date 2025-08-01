import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import AuthWrapper from '@/components/DocumentAnalysis/AuthWrapper';
import ClientDashboard from '@/components/DocumentAnalysis/ClientDashboard';
import OperatorDashboard from '@/components/DocumentAnalysis/OperatorDashboard';
import CreateOrder from '@/components/DocumentAnalysis/CreateOrder';
import OrderDetails from '@/components/DocumentAnalysis/OrderDetails';
import PaymentSuccess from '@/components/DocumentAnalysis/PaymentSuccess';
import AppSidebar from '@/components/DocumentAnalysis/AppSidebar';
import Header from '@/components/DocumentAnalysis/Header';

function App() {
  return (
    <Router>
      <AuthWrapper>
        <SidebarProvider collapsedWidth={56}>
          <div className="min-h-screen flex w-full">
            <Header />
            <div className="flex flex-1">
              <AppSidebar />
              <main className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<ClientDashboard />} />
                  <Route path="/operator" element={<OperatorDashboard />} />
                  <Route path="/create-order" element={<CreateOrder />} />
                  <Route path="/order/:id" element={<OrderDetails />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </AuthWrapper>
      <Toaster />
    </Router>
  );
}

export default App;