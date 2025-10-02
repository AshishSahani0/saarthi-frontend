import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Image Imports (Ensure these paths are correct relative to this file)
import articlesImage from '../../assets/articles.png';
import videosImage from '../../assets/videos.png';
import audiosImage from '../../assets/audios.png';
import appsImage from '../../assets/apps.png';
import breathingImage from '../../assets/breathing.png';
import journalingImage from '../../assets/journaling.png';
import breathing1Image from '../../assets/breathing1.png'; // Assuming this is distinct from breathingImage
import relaxImage from '../../assets/relax.png';

// --- Reusable Component for Resource Categories ---
const CategoryCard = ({ src, alt, title, description, buttonText }) => (
  <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg transition-shadow duration-300 hover:shadow-2xl">
    <img src={src} alt={alt} className="w-16 h-16 mb-4" />
    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{title}</h3>
    <p className="text-gray-600 text-center text-sm mb-4 flex-grow">{description}</p>
    <Link 
      to="#" 
      className="px-4 py-2 mt-auto bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
    >
      {buttonText}
    </Link>
  </div>
);

// --- Reusable Component for Featured Resources ---
const FeaturedCard = ({ src, alt, title, description, linkTo, buttonText }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
    <img src={src} alt={alt} className="w-20 h-20 mb-3" />
    <h3 className="text-xl font-bold text-blue-700 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm mb-4 flex-grow">{description}</p>
    <Link 
      to={linkTo} 
      className="px-5 py-2 mt-auto bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
    >
      {buttonText}
    </Link>
  </div>
);


const ResourcesPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* -------------------- Navbar (Responsive) -------------------- */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-extrabold text-blue-600">Saarthi</div>
          
          {/* Desktop Links */}
          <ul className="hidden lg:flex space-x-8 items-center">
            <li><Link to="/home" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link></li>
            <li><Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">About</Link></li>
            <li><Link to="/resources" className="text-blue-600 font-semibold border-b-2 border-blue-600">Resources</Link></li>
            <li>
              <Link to="/login" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                Begin your Journey
              </Link>
            </li>
          </ul>

          {/* Mobile/Tablet Actions */}
          <div className="flex items-center space-x-3 lg:hidden">
            {/* 1. Mobile Login Button */}
            <Link 
              to="/login" 
              className="px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-md"
            >
              Login
            </Link>
            
            {/* 2. Mobile Menu Button (Hamburger) */}
            <button 
              className="text-gray-700 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
              </svg>
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu Dropdown (When open) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-4 space-y-2 bg-gray-50 border-t">
            <Link to="/home" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 rounded-md">Home</Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 rounded-md">About</Link>
            <Link to="/resources" className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md">Resources</Link>
          </div>
        )}
      </header>

      {/* -------------------- Hero Section (Responsive) -------------------- */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
            Explore Our <span className="text-blue-600">Resources</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Curated mental health and wellness materials to support your journey toward balance and focus.
          </p>
        </div>
      </section>

      {/* -------------------- Resource Categories (Responsive Grid) -------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">Resource Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <CategoryCard 
              src={articlesImage} 
              alt="Articles" 
              title="Articles" 
              description="Well-researched articles on stress management, mindfulness, and productivity."
              buttonText="Explore" 
            />
            <CategoryCard 
              src={videosImage} 
              alt="Videos" 
              title="Videos" 
              description="Relaxing guided meditations, yoga sessions, and mental wellness tutorials."
              buttonText="Watch" 
            />
            <CategoryCard 
              src={audiosImage} 
              alt="Audios" 
              title="Audios" 
              description="Curated playlists for sleep, focus, and calm, available anytime."
              buttonText="Listen" 
            />
            <CategoryCard 
              src={appsImage} 
              alt="Apps" 
              title="Apps & Tools" 
              description="Recommended apps and digital tools to track your mental wellbeing daily."
              buttonText="Discover" 
            />
          </div>
        </div>
      </section>

      {/* -------------------- Featured Resources (Responsive Grid) -------------------- */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">Featured Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <FeaturedCard 
              src={breathingImage} 
              alt="Meditation" 
              title="10-Minute Daily Meditation" 
              description="Quick guided meditation to reduce stress and increase focus."
              linkTo="#"
              buttonText="Start Now" 
            />
            <FeaturedCard 
              src={journalingImage} 
              alt="Journaling" 
              title="Reflective Journaling" 
              description="Simple prompts to reflect on thoughts and emotions daily."
              linkTo="/journaling"
              buttonText="Try It" 
            />
            <FeaturedCard 
              src={breathing1Image} 
              alt="Breathing" 
              title="Breathing Exercises" 
              description="Easy 4-7-8 and box breathing exercises to calm your mind."
              linkTo="#"
              buttonText="Learn More" 
            />
            <FeaturedCard 
              src={relaxImage} 
              alt="Sleep" 
              title="Sleep & Relaxation" 
              description="Guided audios and tips to improve your sleep quality."
              linkTo="#"
              buttonText="Listen" 
            />
          </div>
        </div>
      </section>

      {/* -------------------- Footer (Responsive) -------------------- */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-sm md:text-base">&copy; 2025 Saarthi | All Rights Reserved</p>
          <p className="text-xs md:text-sm">Contact: support@saarthi.org | Helpline: +91-1234567890</p>
          <p className="text-xs md:text-sm">Address: NIET, Greater Noida</p>
        </div>
      </footer>
    </div>
  );
};

export default ResourcesPage;