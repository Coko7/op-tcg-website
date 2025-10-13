import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen relative">
      {/* Glassmorphism Background - déjà défini dans index.css body */}
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;