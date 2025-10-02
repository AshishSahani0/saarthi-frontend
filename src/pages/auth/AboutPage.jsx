import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// IMPORTANT: Ensure these image paths are correct relative to this file
import harshitImage from '../../assets/Harshit.png';
import sudhaImage from '../../assets/sudha.png';
import ayushImage from '../../assets/ayush.png';
import ashImage from '../../assets/ash.png';
import prakImage from '../../assets/prak.png';
import namitImage from '../../assets/namit.png';

const AboutPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define a reusable component for the Team Member card
  const TeamCard = ({ src, name, role }) => (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
      <div className="w-32 h-32 md:w-40 md:h-40 overflow-hidden rounded-full ring-4 ring-blue-500 ring-opacity-50 mb-4">
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xl font-bold text-gray-800 text-center">{name}</h3>
      <p className="text-blue-600 font-medium text-center">{role}</p>
    </div>
  );

  return (
    <>
      {/* -------------------- Navbar (Responsive) -------------------- */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-extrabold text-blue-600">Saarthi</div>
          
          {/* Desktop Links */}
          <ul className="hidden lg:flex space-x-8 items-center">
            <li><Link to="/home" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link></li>
            <li><Link to="/about" className="text-blue-600 font-semibold border-b-2 border-blue-600">About</Link></li>
            <li><Link to="/resources" className="text-gray-700 hover:text-blue-600 transition-colors">Resources</Link></li>
            <li>
              <Link to="/login" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                Begin your Journey
              </Link>
            </li>
          </ul>

          {/* Mobile/Tablet Actions */}
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
            <Link to="/home" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 rounded-md">Home</Link>
            <Link to="/about" className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md">About</Link>
            <Link to="/resources" className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50 rounded-md">Resources</Link>
            {/* The Login/Journey button is now prominently placed next to the hamburger icon */}
          </div>
        )}
      </header>

      {/* -------------------- Hero Section (Responsive) -------------------- */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
            About <span className="text-blue-600">Saarthi</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted companion for mental health and student wellbeing
          </p>
        </div>
      </section>

      {/* -------------------- Mission / Vision Cards (Responsive) -------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">Our Purpose</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-6 border-t-4 border-blue-600 rounded-xl shadow-md text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                <span className="text-3xl mr-2">🎯</span> Mission
              </h3>
              <p className="text-gray-600">Empowering students with accessible mental wellness tools, counseling, and support community.</p>
            </div>
            {/* Card 2 */}
            <div className="p-6 border-t-4 border-blue-600 rounded-xl shadow-md text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                <span className="text-3xl mr-2">💡</span> Approach
              </h3>
              <p className="text-gray-600">Blending AI-guided support, peer connections, and professional guidance for holistic care.</p>
            </div>
            {/* Card 3 */}
            <div className="p-6 border-t-4 border-blue-600 rounded-xl shadow-md text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                <span className="text-3xl mr-2">🌍</span> Why Saarthi?
              </h3>
              <p className="text-gray-600">Designed for Indian students with language support, offline access, and institutional collaboration.</p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- Timeline Section (Responsive) -------------------- */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">Our Journey</h2>
          
          <div className="relative border-l-4 border-blue-600 space-y-12 ml-4 sm:ml-12 md:ml-24">
            
            {/* Item 1 */}
            <div className="relative pl-6">
              <div className="absolute w-4 h-4 bg-blue-600 rounded-full mt-1 -left-2"></div>
              <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">2023</h3>
                <p className="text-gray-700">Idea conceptualized by educators & students passionate about mental wellness.</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="relative pl-6">
              <div className="absolute w-4 h-4 bg-blue-600 rounded-full mt-1 -left-2"></div>
              <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">2024</h3>
                <p className="text-gray-700">Prototype tested in colleges with positive engagement from students.</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="relative pl-6">
              <div className="absolute w-4 h-4 bg-blue-600 rounded-full mt-1 -left-2"></div>
              <div className="bg-white p-6 rounded-lg shadow-md max-w-lg">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">2025</h3>
                <p className="text-gray-700">Official launch, reaching thousands of students across India.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* -------------------- Team Section (Responsive Grid) -------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            <TeamCard src={harshitImage} name="Harshit Nainwal" role="Frontend & UI" />
            <TeamCard src={sudhaImage} name="Sudhanshu Mishra" role="Leader" />
            <TeamCard src={ayushImage} name="Ayush Kumar Mandal" role="Student Advisor" />
            <TeamCard src={ashImage} name="Ashish Sahani" role="Backend & Database" />
            <TeamCard src={prakImage} name="Prakriti Srivastava" role="Documentation" />
            <TeamCard src={namitImage} name="Namit Raj" role="Research & AI Developer" />
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
    </>
  );
};

export default AboutPage;