// src/layout/DashboardLayout.jsx

import { Outlet } from "react-router-dom";
import { useState } from "react"; // 1. Import useState
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingActions from "../components/FloatingActions"; // Ensure this path is correct

export default function DashboardLayout() {
  // 2. State to manage the mobile menu visibility
  const [isMobileOpen, setMobileOpen] = useState(false);

  // 3. Toggle function to open/close the mobile menu
  const toggleMobileMenu = () => {
    setMobileOpen(prev => !prev);
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* Sidebar: Pass the mobile state and setter */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      <div className="flex-1 flex flex-col md:ml-64 backdrop-blur-lg bg-white/30 dark:bg-gray-800/30 border-l border-white/20 dark:border-gray-700 transition-all duration-300">
        
        {/* Navbar: Pass the toggle function */}
        <Navbar 
          onMenuToggle={toggleMobileMenu} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Renders all floating actions (Crisis, Anonymous, Chatling) */}
      <FloatingActions />
    </div>
  );
}