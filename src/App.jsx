import { useState, useRef } from 'react';
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
  // Always starts locked — puzzle is required every visit
  const [isUnlocked, setIsUnlocked] = useState(false);
  const audioRef = useRef(null);

  const handleUnlock = () => {
    setIsUnlocked(true);
    // Called directly from a click event — browser allows autoplay here
    audioRef.current?.play().catch(() => {});
  };

  return (
    <div className="app-container">
      <audio ref={audioRef} src="/music/music.mp3" loop />

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