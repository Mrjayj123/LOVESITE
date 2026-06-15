import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './Hero.css';

const HEART_EMOJIS = ['💖', '💕', '💗', '💝', '💓', '♥', '🤍', '✨'];

export default function Hero() {
  const hearts = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${10 + Math.random() * 15}s`,
      size: `${0.8 + Math.random() * 1.5}rem`,
    }));
  }, []);

  const scrollToContent = () => {
    const gallery = document.getElementById('gallery');
    if (gallery) {
      gallery.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" id="home">
      {/* Floating Hearts */}
      <div className="hero-hearts">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="hero-heart"
            style={{
              left: h.left,
              fontSize: h.size,
              animationDelay: h.delay,
              animationDuration: h.duration,
            }}
          >
            {h.emoji}
          </span>
        ))}
      </div>

      {/* Main Content */}
      <div className="hero-content">
        <motion.p
          className="hero-greeting"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {siteContent.hero.greeting}
        </motion.p>

        <motion.h1
          className="hero-name"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {siteContent.name}
        </motion.h1>

        <motion.div
          className="hero-heart-icon"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: [0.34, 1.56, 0.64, 1] }}
        >
          💝
        </motion.div>

        <motion.p
          className="hero-quote"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          &ldquo;{siteContent.hero.quote}&rdquo;
        </motion.p>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          {siteContent.hero.subtitle}
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="hero-scroll-indicator"
        onClick={scrollToContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
      >
        <span className="hero-scroll-text">Scroll</span>
        <div className="hero-scroll-line" />
      </motion.div>
    </section>
  );
}
