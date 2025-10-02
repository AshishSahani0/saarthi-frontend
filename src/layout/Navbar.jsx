import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Cog6ToothIcon, Bars3Icon } from "@heroicons/react/24/outline"; // Import Bars3Icon
import SettingsPopup from "../popups/SettingsPopup";

// Add onMenuToggle prop
export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const getDashboardTitle = () => {
    const titles = {
      MainAdmin: "Main Admin Dashboard",
      InstitutionAdmin: "Institution Admin Dashboard",
      CollegePsychologist: "Psychologist Dashboard",
      Student: "Student Dashboard",
    };
    return titles[user?.role] || "Dashboard";
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full h-16 px-4 sm:px-6 
        flex items-center justify-between 
        bg-white/90 dark:bg-gray-800/90
        backdrop-blur-lg border-b border-white/20 dark:border-gray-700
        shadow-lg md:ml-64 md:w-[calc(100%-16rem)]" // <-- Adjusting width for desktop sidebar
      >
        {/* Mobile Menu Button (Visible below medium size) */}
        <div className="flex items-center">
            <button
                onClick={onMenuToggle} // Use the prop to toggle the mobile menu
                className="md:hidden p-2 mr-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-md"
                aria-label="Open sidebar menu"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
            
            {/* Dashboard Title */}
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
                {getDashboardTitle()}
            </h1>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            title="Settings"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPopup
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}