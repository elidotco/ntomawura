"use client";
import { useState, useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400&display=swap');

  .nw-about * { box-sizing: border-box; margin: 0; padding: 0; }

  .nw-about {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    background: #F5F2EC;
    color: #1a1a18;
    overflow: hidden;
  }

  .nw-serif { font-family: 'Cormorant Garamond', serif; }

  /* ── Hero ── */
  .nw-hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 520px;
  }

  .nw-hero-left {
    background: #2c2b27;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 3rem;
    overflow: hidden;
  }

  .nw-hero-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 40px,
      rgba(255,255,255,0.015) 40px,
      rgba(255,255,255,0.015) 41px
    );
  }

  .nw-hero-left::after {
    content: 'N';
    font-family: 'Cormorant Garamond', serif;
    font-size: 320px;
    font-weight: 300;
    color: rgba(255,255,255,0.04);
    position: absolute;
    top: -60px;
    left: -20px;
    line-height: 1;
    pointer-events: none;
  }

  .nw-hero-left-content { position: relative; z-index: 1; }

  .nw-eyebrow {
    font-size: 10px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #b5a98a;
    margin-bottom: 1.2rem;
  }

  .nw-hero-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 54px;
    font-weight: 300;
    line-height: 1.1;
    color: #f5f2ec;
  }

  .nw-hero-heading em {
    font-style: italic;
    color: #c9b98a;
  }

  .nw-hero-right {
    background: #eee9de;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem 3.5rem;
  }

  .nw-story-label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #8a7d64;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .nw-story-label::before {
    content: '';
    display: block;
    width: 32px;
    height: 0.5px;
    background: #8a7d64;
  }

  .nw-story-text {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px;
    font-weight: 300;
    line-height: 1.7;
    color: #2c2b27;
    margin-bottom: 2rem;
  }

  .nw-story-body {
    font-size: 13px;
    letter-spacing: 0.04em;
    line-height: 1.85;
    color: #5c5447;
  }

  /* ── Pillars ── */
  .nw-pillars {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 0.5px solid #d4cdc0;
  }

  .nw-pillar {
    padding: 2.5rem 2rem;
    border-right: 0.5px solid #d4cdc0;
    transition: background 0.4s ease;
    cursor: default;
  }

  .nw-pillar:last-child { border-right: none; }
  .nw-pillar:hover { background: #ece7db; }

  .nw-pillar-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px;
    font-weight: 300;
    color: #d4cdc0;
    line-height: 1;
    margin-bottom: 1rem;
  }

  .nw-pillar-title {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #2c2b27;
    margin-bottom: 0.75rem;
  }

  .nw-pillar-text {
    font-size: 12.5px;
    line-height: 1.8;
    color: #6b6055;
    letter-spacing: 0.02em;
  }

  /* ── Manifesto ── */
  .nw-manifesto {
    display: grid;
    grid-template-columns: 1fr 2fr;
    border-top: 0.5px solid #d4cdc0;
  }

  .nw-manifesto-left {
    padding: 3.5rem 2.5rem;
    border-right: 0.5px solid #d4cdc0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .nw-manifesto-tag {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #8a7d64;
  }

  .nw-manifesto-right { padding: 3.5rem 3rem; }

  .nw-quote {
    font-family: 'Cormorant Garamond', serif;
    font-size: 34px;
    font-weight: 300;
    font-style: italic;
    line-height: 1.45;
    color: #2c2b27;
    margin-bottom: 1.5rem;
  }

  .nw-quote-attr {
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7d64;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nw-quote-attr::before {
    content: '';
    display: block;
    width: 20px;
    height: 0.5px;
    background: #8a7d64;
  }

  /* ── Footer strip ── */
  .nw-footer-strip {
    background: #2c2b27;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2.5rem;
  }

  .nw-footer-brand {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    letter-spacing: 0.1em;
    color: #f5f2ec;
    font-weight: 300;
  }

  .nw-cta {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #c9b98a;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    background: none;
    border: none;
    transition: gap 0.3s ease;
    padding: 0;
  }

  .nw-cta:hover { gap: 16px; }

  /* ── Badge ── */
  .nw-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7d64;
    margin-top: auto;
  }

  .nw-badge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #b5a98a;
    flex-shrink: 0;
  }

  /* ── Fade-in animation ── */
  .nw-fade {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .nw-fade.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .nw-hero { grid-template-columns: 1fr; }
    .nw-hero-left { min-height: 260px; padding: 2rem; }
    .nw-hero-heading { font-size: 38px; }
    .nw-hero-right { padding: 2.5rem 2rem; }
    .nw-pillars { grid-template-columns: 1fr; }
    .nw-pillar { border-right: none; border-bottom: 0.5px solid #d4cdc0; }
    .nw-manifesto { grid-template-columns: 1fr; }
    .nw-manifesto-left {
      border-right: none;
      border-bottom: 0.5px solid #d4cdc0;
      padding: 2rem;
      flex-direction: row;
      align-items: center;
    }
    .nw-manifesto-right { padding: 2rem; }
    .nw-quote { font-size: 26px; }
    .nw-badge { margin-top: 0; }
  }
`;

const pillars = [
  {
    num: "01",
    title: "Craft",
    text: "Every seam is considered. We partner with artisan weavers and tailors whose families have practised their craft for generations, blending traditional technique with contemporary silhouettes.",
  },
  {
    num: "02",
    title: "Community",
    text: "Ntomawura is a living ecosystem — designers, weavers, customers, and culture — moving together. When you wear our pieces, you wear the hands and stories of an entire community.",
  },
  {
    num: "03",
    title: "Continuity",
    text: "We design for heirloom. Not fast, not fleeting. Our tailored pieces and ready-to-wear collections are made to outlast seasons and become the garments your children will ask to borrow.",
  },
];

function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transitionDelay = `${delay}ms`;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`nw-fade ${className}`}>
      {children}
    </div>
  );
}

export default function About() {
  const [ctaHovered, setCtaHovered] = useState(false);

  return (
    <>
      <style>{styles}</style>
      <section className="nw-about" aria-label="About Ntomawura">
        {/* ── Hero ── */}
        <div className="nw-hero">
          <div className="nw-hero-left">
            <div className="nw-hero-left-content">
              <FadeIn delay={0}>
                <p className="nw-eyebrow">Est. in Ghana, made for the world</p>
              </FadeIn>
              <FadeIn delay={150}>
                <h1 className="nw-hero-heading">
                  Dressed in
                  <br />
                  <em>heritage,</em>
                  <br />
                  worn with
                  <br />
                  intention.
                </h1>
              </FadeIn>
            </div>
          </div>

          <div className="nw-hero-right">
            <FadeIn delay={200}>
              <p className="nw-story-label">Our story</p>
              <p className="nw-story-text">
                Ntomawura — <em>"the cloth has arrived"</em> — is a Ghanaian
                fashion house rooted in the living tradition of Kente, Kaba, and
                handwoven textiles.
              </p>
              <p className="nw-story-body">
                We believe that clothing is memory. Each piece we create carries
                the weight of generations — the weavers of Bonwire, the
                dye-masters of the North, the seamstresses who turned fabric
                into ceremony. We translate that legacy into garments that move
                through a modern world without forgetting where they come from.
              </p>
            </FadeIn>
          </div>
        </div>

        {/* ── Pillars ── */}
        <div className="nw-pillars">
          {pillars.map((p, i) => (
            <FadeIn key={p.num} delay={i * 100} className="nw-pillar">
              <p className="nw-pillar-num nw-serif">{p.num}</p>
              <p className="nw-pillar-title">{p.title}</p>
              <p className="nw-pillar-text">{p.text}</p>
            </FadeIn>
          ))}
        </div>

        {/* ── Manifesto ── */}
        <div className="nw-manifesto">
          <FadeIn className="nw-manifesto-left">
            <p className="nw-manifesto-tag">Philosophy</p>
            <div className="nw-badge">
              <span className="nw-badge-dot" />
              Accra · Ghana
            </div>
          </FadeIn>

          <FadeIn delay={100} className="nw-manifesto-right">
            <p className="nw-quote">
              "African fashion is not a trend to be adopted — it is a language
              to be spoken fluently, with reverence and with joy."
            </p>
            <p className="nw-quote-attr">Ntomawura </p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
