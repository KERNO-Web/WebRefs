import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// the cut is authored from the first frame; don't restore mid-transition
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

createRoot(document.getElementById('root')!).render(<App />);
