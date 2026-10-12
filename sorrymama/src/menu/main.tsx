import { createRoot } from 'react-dom/client';
import { MenuPage } from './MenuPage';
import '../styles/tokens.css';
import '../styles/global.css';
import '../styles/sections.css';
import '../styles/menu-page.css';

if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('rm');

createRoot(document.getElementById('root')!).render(<MenuPage />);
