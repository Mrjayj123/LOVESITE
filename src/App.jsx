import { useState, useEffect } from 'react';
import ChessPuzzle from './components/ChessPuzzle';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PhotoGallery from './components/PhotoGallery';
import VideoShowcase from './components/VideoShowcase';
import LoveLetters from './components/LoveLetters';
import Timeline from './components/Timeline';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check if previously unlocked in this session/browser
  useEffect(() => {
    const savedStatus = localStorage.getItem('Paula_love_unlocked');
    if (savedStatus === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    localStorage.setItem('Paula_love_unlocked', 'true');
  };

  return (
    <div className="app-container">
      {!isUnlocked ? (
        <ChessPuzzle onSolved={handleUnlock} />
      ) : (
        <>
          <Navbar />
          <main>
            <Hero />
            <PhotoGallery />
            <VideoShowcase />
            <LoveLetters />
            <Timeline />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}
