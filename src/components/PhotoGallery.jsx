import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './PhotoGallery.css';

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #2d1b2e 0%, #1a1a28 50%, #2a1f1f 100%)',
  'linear-gradient(135deg, #1a1a28 0%, #2d1b2e 50%, #1c2333 100%)',
  'linear-gradient(135deg, #2a1f1f 0%, #1a1a28 50%, #2d1b2e 100%)',
  'linear-gradient(135deg, #1c2333 0%, #2a1f1f 50%, #1a1a28 100%)',
  'linear-gradient(135deg, #2d1b2e 0%, #2a1f1f 50%, #1c2333 100%)',
  'linear-gradient(135deg, #1a1a28 0%, #1c2333 50%, #2d1b2e 100%)',
];

const PLACEHOLDER_ICONS = ['📸', '🌸', '✨', '💫', '🌹', '💖'];

export default function PhotoGallery() {
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [loadedImages, setLoadedImages] = useState({});
  const galleryRef = useRef(null);
  const { photos } = siteContent;

  // Track image loading
  const handleImageLoad = (index) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageError = (index) => {
    setLoadedImages((prev) => ({ ...prev, [index]: false }));
  };
 // ✅ Fix: check if image is already cached/complete on mount
  const imgRefs = useRef({});
  useEffect(() => {
    photos.forEach((_, index) => {
      const img = imgRefs.current[index];
      if (img && img.complete && img.naturalWidth > 0) {
        handleImageLoad(index);
      }
    });
  }, []);
  const openLightbox = (index) => {
    setLightbox({ open: true, index });
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightbox({ open: false, index: 0 });
    document.body.style.overflow = '';
  };

  const navigate = (direction) => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + direction + photos.length) % photos.length,
    }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (!lightbox.open) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox.open]);

  return (
    <section className="photo-gallery" id="gallery">
      <div className="container">
        <motion.h2
          className="section-title text-gradient"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          Our Moments 📸
        </motion.h2>
        <motion.p
          className="section-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Every picture tells a piece of our story
        </motion.p>

        <div className="gallery-grid" ref={galleryRef}>
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              className="gallery-item"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => openLightbox(index)}
            >
            {/* ✅ Always render the img, use ref to catch cached loads */}

                            <img
                ref={(el) => (imgRefs.current[index] = el)}
                src={photo.src}
                alt={photo.caption}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageError(index)}
                style={{
                  display: loadedImages[index] === false ? 'none' : 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {loadedImages[index] === false && (
                <div
                  className="gallery-placeholder"
                  style={{ background: PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length] }}
                >
                  <span className="gallery-placeholder-icon">❌</span>
                  <span className="gallery-placeholder-text">Photo not found</span>
                </div>
              )}


              <div className="gallery-caption">
                <p>{photo.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox.open && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
            <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); navigate(-1); }}>‹</button>
            <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); navigate(1); }}>›</button>

            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              key={lightbox.index}
            >
              {loadedImages[lightbox.index] ? (
                <img
                  src={photos[lightbox.index].src}
                  alt={photos[lightbox.index].caption}
                />
              ) : (
                <div
                  className="gallery-placeholder"
                  style={{
                    background: PLACEHOLDER_GRADIENTS[lightbox.index % PLACEHOLDER_GRADIENTS.length],
                    width: '60vw',
                    height: '60vh',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span className="gallery-placeholder-icon" style={{ fontSize: '4rem' }}>
                    {PLACEHOLDER_ICONS[lightbox.index % PLACEHOLDER_ICONS.length]}
                  </span>
                </div>
              )}
              <p className="lightbox-caption">{photos[lightbox.index].caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
