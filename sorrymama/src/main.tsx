import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/responsive.css';

if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('rm');

createRoot(document.getElementById('root')!).render(<App />);
