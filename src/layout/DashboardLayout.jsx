// src/layout/DashboardLayout.jsx

import { Outlet } from "react-router-dom";
import { useState } from "react"; 
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingActions from "../components/FloatingActions"; 

export default function DashboardLayout() {
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileOpen(prev => !prev);
  };
  
  return (
    // Use flex-row and h-screen to establish the main split screen layout
    <div className="flex w-full min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* 1. Sidebar (Fixed on Desktop, Controlled on Mobile) */}
      <Sidebar 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* 2. Main Content Area */}
      {/* md:w-full is required to fill the remaining space when ml-64 is set */}
      <div className="flex-1 flex flex-col md:w-[calc(100%-16rem)] md:ml-64 transition-all duration-300">
        
        {/* Navbar (Fixed to the top of the content area) */}
        <Navbar 
          onMenuToggle={toggleMobileMenu} 
        />
        
        {/* The main content area, providing space below the fixed Navbar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 mt-16">
          <Outlet />
        </main>
      </div>
      
      {/* Renders all floating actions (Crisis, Anonymous, Chatling) */}
      <FloatingActions />
    </div>
  );
}