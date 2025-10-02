import React, { useState } from "react";
import { Link } from "react-router-dom";

// Image Imports (Ensure these paths are correct relative to HomePage.jsx)
import heroIllustration from "../../assets/hero-illustration.png";
import anxietyIcon from "../../assets/anxiety.png";
import sleepIcon from "../../assets/sleep.png";
import studyIcon from "../../assets/study.png";
import communityIcon from "../../assets/community.png";
import musicIcon from "../../assets/music.png";
import journalingIcon from "../../assets/journaling.png";
import breathingIcon from "../../assets/breathing.png";
import relaxIcon from "../../assets/relax.png";

const IconCard = ({ src, alt, title, description }) => (
  <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg transition-shadow duration-300 hover:shadow-2xl">
    <img src={src} alt={alt} className="w-16 h-16 mb-4" />
    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{title}</h3>
    <p className="text-gray-600 text-center text-sm">{description}</p>
  </div>
);

const WellnessItem = ({ src, alt, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center transition-transform duration-300 hover:scale-[1.02]">
    <img src={src} alt={alt} className="w-12 h-12 mb-3" />
    <h4 className="text-lg font-semibold text-blue-700">{title}</h4>
    <p className="text-gray-500 text-sm mt-1">{description}</p>
  </div>
);

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* -------------------- Navbar (Responsive) -------------------- */}
<header className="sticky top-0 z-50 bg-white shadow-md">
  <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
    <div className="text-2xl font-extrabold text-blue-600">Saarthi</div>

    {/* Desktop Links (Hidden below large screen size) */}
    <ul className="hidden lg:flex space-x-8 items-center">
      <li><Link to="/home" className="text-blue-600 font-semibold border-b-2 border-blue-600">Home</Link></li>
      <li><Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">About</Link></li>
      <li><Link to="/resources" className="text-gray-700 hover:text-blue-600 transition-colors">Resources</Link></li>
      <li>
        <Link to="/login" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
          Begin your Journey
        </Link>
      </li>
    </ul>

    {/* Mobile/Tablet Actions (Visible up to large screen size) */}
    <div className="flex items-center space-x-3 lg:hidden">
      {/* 1. Mobile Login Button (Visible on mobile, hidden on desktop) */}
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
      <Link to="/home" className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md">Home</Link>
      <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 rounded-md">About</Link>
      <Link to="/resources" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 rounded-md">Resources</Link>
      {/* Removed the redundant 'Begin your Journey' button from the bottom of the dropdown */}
    </div>
  )}
</header>

      {/* -------------------- Hero Section (Responsive) -------------------- */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Hero Text */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Find Your <span className="text-blue-600">Inner Calm</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl lg:max-w-none mx-auto lg:mx-0">
              Your mental wellbeing companion – explore guided meditation, stress
              relief, and peer support in one safe platform.
            </p>
            <Link to="/login" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-xl transform hover:scale-[1.02]">
              ✨ Start Your Journey
            </Link>
          </div>

          {/* Hero Image */}
          <div className="lg:w-1/2 flex justify-center order-first lg:order-last">
            <img 
              src={heroIllustration} 
              alt="Calm Illustration" 
              className="w-full max-w-md lg:max-w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* -------------------- Features Section (Responsive Grid) -------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">How Saarthi Supports You</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <IconCard 
              src={anxietyIcon} 
              alt="Anxiety Relief" 
              title="Anxiety Relief" 
              description="Guided relaxation, breathing techniques, and quick exercises to ease the mind." 
            />
            <IconCard 
              src={sleepIcon} 
              alt="Better Sleep" 
              title="Better Sleep" 
              description="Calming bedtime audios, stories, and routines for deeper rest." 
            />
            <IconCard 
              src={studyIcon} 
              alt="Study Balance" 
              title="Study-Life Balance" 
              description="Focus boosters, mindfulness strategies, and productivity tips for students." 
            />
            <IconCard 
              src={communityIcon} 
              alt="Community Support" 
              title="Community Support" 
              description="Connect anonymously with peers and trained listeners in a safe space." 
            />
          </div>
        </div>
      </section>

      {/* -------------------- Wellness Zone (Responsive Grid) -------------------- */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-4">
            🌼 Wellness Zone
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            Take a break, breathe, and explore resources made for you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <WellnessItem 
              src={musicIcon} 
              alt="Relaxing Music" 
              title="Relaxing Music" 
              description="Soothing soundtracks for calm and focus." 
            />
            <WellnessItem 
              src={journalingIcon} 
              alt="Journaling" 
              title="Journaling" 
              description="Daily prompts to reflect and declutter your mind." 
            />
            <WellnessItem 
              src={breathingIcon} 
              alt="Breathing Exercise" 
              title="Breathing Exercise" 
              description="Follow guided techniques for stress relief." 
            />
            <WellnessItem 
              src={relaxIcon} 
              alt="Sleep" 
              title="Sleep & Relaxation" 
              description="Guided audios and tips to improve your sleep quality." 
            />
          </div>
        </div>
      </section>

      {/* -------------------- Motivational Quote -------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl sm:text-3xl font-light italic text-gray-800 relative">
            <span className="text-blue-600 text-5xl absolute -top-4 left-0 opacity-20">"</span>
            "Peace comes from within. Do not seek it without."
            <footer className="mt-4 text-lg font-semibold text-blue-600">- Buddha</footer>
          </blockquote>
        </div>
      </section>

      {/* -------------------- Footer -------------------- */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:justify-between md:items-center">
          <div className="flex justify-center md:justify-start space-x-6 mb-4 md:mb-0">
            <Link to="/about" className="hover:text-blue-400 transition-colors text-sm md:text-base">About</Link>
            <Link to="/resources" className="hover:text-blue-400 transition-colors text-sm md:text-base">Resources</Link>
            <Link to="/contact" className="hover:text-blue-400 transition-colors text-sm md:text-base">Contact</Link>
          </div>
          <p className="text-sm md:text-base">&copy; 2025 Saarthi | All Rights Reserved</p>
        </div>
      </footer>
    </>
  );
};

export default HomePage;