import { useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Cursor } from '../components/Cursor';
import { HeroJourney } from '../features/hero/HeroJourney';
import { Atmosphere } from '../features/atmosphere/Atmosphere';
import { Terrace } from '../features/terrace/Terrace';
import { Menu } from '../features/menu/Menu';
import { Gallery } from '../features/gallery/Gallery';
import { Visit } from '../features/contacts/Visit';

export default function App() {
  // header contrast follows whatever is under it: the hero reports day/night from its timeline,
  // every later section declares its own tone
  const heroNight = useRef(false);
  const underHeader = useRef<string | null>('hero');
  const setTone = () => {
    const t = underHeader.current === 'hero' || !underHeader.current ? (heroNight.current ? 'night' : 'day') : underHeader.current;
    document.documentElement.dataset.tone = t;
  };
  const onTone = (night: boolean) => { if (heroNight.current !== night) { heroNight.current = night; setTone(); } };

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-tone]')];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) underHeader.current = (e.target as HTMLElement).dataset.tone!;
      // nothing tracked under the header: we are inside the hero
      if (!els.some((el) => { const r = el.getBoundingClientRect(); return r.top <= 36 && r.bottom > 36; })) underHeader.current = 'hero';
      setTone();
    }, { rootMargin: '-36px 0px -99% 0px' });
    els.forEach((el) => io.observe(el));
    setTone();
    return () => io.disconnect();
  }, []);

  return (
    <>
      <a className="skip" href="#main">К содержимому</a>
      <Header />
      <main id="main">
        <HeroJourney onTone={onTone} />
        <Atmosphere />
        <Terrace />
        <Menu />
        <Gallery />
        <Visit />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
