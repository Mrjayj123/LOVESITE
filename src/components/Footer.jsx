import { motion } from 'framer-motion';
import { siteContent } from '../data/siteContent';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="footer-heart">💝</div>
        <p className="footer-message">{siteContent.footer.message}</p>
        <p className="footer-year">© {siteContent.footer.year}</p>
      </motion.div>
    </footer>
  );
}
