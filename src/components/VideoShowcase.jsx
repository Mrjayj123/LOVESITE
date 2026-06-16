import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './VideoShowcase.css';

export default function VideoShowcase() {
  const { videos } = siteContent;
  const [playingIndex, setPlayingIndex] = useState(null);
  const [loadedVideos, setLoadedVideos] = useState({});
  const videoRefs = useRef({});

  const handlePlay = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.play();
      setPlayingIndex(index);
    }
  };

  const handlePause = (index) => {
    setPlayingIndex(null);
  };

  const handleVideoError = (index) => {
    setLoadedVideos((prev) => ({ ...prev, [index]: false }));
  };

  const handleVideoLoad = (index) => {
    setLoadedVideos((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <section className="video-showcase" id="videos">
      <div className="container">
        <motion.h2
          className="section-title text-gradient"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          Our Videos 🎬
        </motion.h2>
        <motion.p
          className="section-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          How I love looking at you
        </motion.p>

        <div className="video-grid">
          {videos.map((video, index) => (
            <motion.div
              key={index}
              className="video-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="video-player-wrapper">
                {loadedVideos[index] !== false ? (
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={video.src}
                    onPause={() => handlePause(index)}
                    onEnded={() => handlePause(index)}
                    onLoadedData={() => handleVideoLoad(index)}
                    onError={() => handleVideoError(index)}
                    controls={playingIndex === index}
                    playsInline
                    style={{ display: loadedVideos[index] ? 'block' : 'none' }}
                  />
                ) : null}

                {loadedVideos[index] !== true && (
                  <div className="video-placeholder">
                    <div className="video-placeholder-icon">🎥</div>
                    <span className="video-placeholder-text">
                      Drop your video in public/videos/
                    </span>
                  </div>
                )}

                <div
                  className={`video-play-overlay ${playingIndex === index ? 'hidden' : ''}`}
                  onClick={() => handlePlay(index)}
                >
                  <div className="video-play-btn" />
                </div>
              </div>

              <div className="video-info">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
