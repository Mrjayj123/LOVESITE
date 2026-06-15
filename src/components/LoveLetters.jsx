import { motion } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './LoveLetters.css';

const FLOURISHES = ['♥', '✿', '❋', '♡'];

export default function LoveLetters() {
  const { loveLetters } = siteContent;

  return (
    <section className="love-letters" id="letters">
      <div className="container">
        <motion.h2
          className="section-title text-gradient"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          Love Letters 💌
        </motion.h2>
        <motion.p
          className="section-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Words from the deepest corners of my heart
        </motion.p>

        <div className="letters-grid">
          {loveLetters.map((letter, index) => (
            <motion.div
              key={index}
              className="letter-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
            >
              <p className="letter-date">{letter.date}</p>
              <h3 className="letter-title">{letter.title}</h3>
              <p className="letter-content">{letter.content}</p>
              <div className="letter-flourish">
                {FLOURISHES[index % FLOURISHES.length]}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
