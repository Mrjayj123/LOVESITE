import { useState, useEffect, useRef } from 'react';
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
  const audioRef = useRef(null);

  useEffect(() => {
    const savedStatus = localStorage.getItem('Paula_love_unlocked');
    if (savedStatus === 'true') {
      setIsUnlocked(true);
      // Page loaded already-unlocked — try playing (may be blocked, that's OK)
      audioRef.current?.play().catch(() => {});
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    localStorage.setItem('Paula_love_unlocked', 'true');
    // Called directly from a click — browser will allow autoplay here
    audioRef.current?.play().catch(() => {});
  };

  return (
    <div className="app-container">
      <audio ref={audioRef} src="/home/jay_joel/JS/Present/public/music/music.mp3" loop />

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