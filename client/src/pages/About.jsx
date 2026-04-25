import React, { useEffect, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from '../utils/api';
import './About.css';
import bgImage from '../assets/college.jpg';

/* ── Animated counter with IntersectionObserver ── */
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const pct = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - pct, 3); // ease-out-cubic
            setCount(Math.floor(eased * target));
            if (pct < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

/* ── Stat Box ── */
function StatBox({ icon, label, value, colorClass }) {
  const [count, ref] = useCountUp(value);
  return (
    <div className={`stat-box ${colorClass}`} ref={ref}>
      <div className="stat-ring" />
      <div className="stat-box-icon"><i className={`fa-solid ${icon}`} /></div>
      <div className="stat-value">{count.toLocaleString('en-IN')}+</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ── UseOnScreen – simple visibility hook ── */
function useOnScreen(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);
  return [ref, visible];
}

/* ── Features data (Exactly 5) ── */
const features = [
  { icon: 'fa-user-shield',        color: 'fi-blue',     title: 'Verified Students',        desc: 'Only registered college students can join, keeping it 100% safe.' },
  { icon: 'fa-hand-holding',       color: 'fi-lavender', title: 'Secure Purchase Requests', desc: 'Sellers review and accept requests to eliminate spam.' },
  { icon: 'fa-calendar-check',     color: 'fi-teal',     title: 'Pickup Scheduling',        desc: 'Schedule handover time and location conveniently in-app.' },
  { icon: 'fa-envelope-open-text', color: 'fi-blue',     title: 'Email Notifications',      desc: 'Get instant alerts when deals are requested or accepted.' },
  { icon: 'fa-heart',              color: 'fi-lavender', title: 'Wishlist System',          desc: 'Save your favorite items and track them until you buy.' },
];

/* ── Why Choose Us data (Exactly 4) ── */
const whyItems = [
  { icon: 'fa-shield-halved', title: 'Safe Campus Environment', desc: 'Secure local trading without leaving your campus borders.', bg: '#E3F2FD', text: '#1565C0' },
  { icon: 'fa-handshake',     title: 'Easy Transactions',       desc: 'Streamlined communication with one-click buying requests.', bg: '#EDE7F6', text: '#6A1B9A' },
  { icon: 'fa-users-slash',   title: 'No Middlemen',            desc: 'Direct student-to-student deals. You keep 100% of your money.', bg: '#E0F7FA', text: '#006064' },
  { icon: 'fa-award',         title: 'Trusted Users',           desc: 'Every account is verified to belong to a real student.', bg: '#E3F2FD', text: '#1565C0' },
];

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
const About = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const sr = await axios.get('/public/stats');
        setStats(sr.data || {});
      } catch (_) {}
      finally { setLoaded(true); }
    };
    load();
  }, []);

  /* ── Reveal hooks for major sections ── */
  const [heroRef]     = useOnScreen(0);
  const [featRef,  featVisible]    = useOnScreen(100);
  const [statsRef, statsVisible]   = useOnScreen(100);
  const [whyRef,   whyVisible]     = useOnScreen(100);
  const [ctaRef,   ctaVisible]     = useOnScreen(100);

  return (
    <>
      {/* ════════════════════ HERO ════════════════════ */}
      <section className="about-hero" ref={heroRef} style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="hero-overlay"></div>
        <Container style={{ position:'relative', zIndex:2 }}>
          <div className="about-reveal">
            <div className="about-hero-badge">
              <i className="fa-solid fa-building-columns" /> CampusCart
            </div>
          </div>
          <h1 className="about-reveal delay-100">
            Your Campus Marketplace,<br />
            <span className="highlight">Reimagined.</span>
          </h1>
          <p className="lead about-reveal delay-200">
            A premium student-first platform to buy, sell, and trade safely within your campus community.
          </p>
          <div className="hero-cta-group about-reveal delay-300">
            <Link to="/home" className="btn-hero-primary">
              <i className="fa-solid fa-cart-shopping" /> Browse Marketplace
            </Link>
            <Link to="/register" className="btn-hero-outline">
              <i className="fa-solid fa-user-plus" /> Join Free
            </Link>
          </div>
        </Container>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-dot" />
          <div className="scroll-dot" />
          <div className="scroll-dot" />
          <small style={{ fontSize:'0.68rem', letterSpacing:'0.06em', textTransform:'uppercase' }}>Scroll</small>
        </div>
      </section>

      {/* ════════════════════ FEATURES (exactly 5) ════════════════════ */}
      <section className="about-section bg-pastel" id="features" ref={featRef}>
        <Container>
          <div className="text-center">
            <span className="section-inner-badge badge-lavender"><i className="fa-solid fa-star" /> Platform Highlights</span>
            <h2 className="section-title">Unique Features</h2>
            <p className="section-sub mx-auto">Built for students, by students.</p>
          </div>
          <div className="features-grid text-center">
            {features.map((f, i) => (
              <div className={`feat-card ${featVisible ? 'about-reveal' : ''}`}
                   key={f.title}
                   style={{ animationDelay: `${i * 0.1}s`, opacity: featVisible ? undefined : 0 }}>
                <div className={`feat-icon mx-auto ${f.color}`}><i className={`fa-solid ${f.icon}`} /></div>
                <div>
                  <div className="feat-title mt-3">{f.title}</div>
                  <div className="feat-desc mt-2">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ════════════════════ STATS (Counters replacing charts) ════════════════════ */}
      <section className="about-section stats-section" id="stats" ref={statsRef}>
        <Container>
          <div className="text-center">
            <span className="section-inner-badge badge-teal"><i className="fa-solid fa-chart-line" /> Community Impact</span>
            <h2 className="section-title">Platform Stats</h2>
            <p className="section-sub mx-auto">Live numbers reflecting our growing marketplace.</p>
          </div>

          <div className={`stats-grid mt-5 ${statsVisible ? 'about-reveal' : ''}`} style={{ opacity: statsVisible ? undefined : 0 }}>
            {loaded && (
              <>
                <StatBox icon="fa-users"    label="Registered Users"  value={stats.totalUsers    || 0} colorClass="sb-blue" />
                <StatBox icon="fa-box-open" label="Products Listed"   value={stats.totalProducts || 0} colorClass="sb-lavender" />
                <StatBox icon="fa-receipt"  label="Successful Orders" value={stats.totalOrders   || 0} colorClass="sb-teal" />
              </>
            )}
          </div>
        </Container>
      </section>

      {/* ════════════════════ WHY CHOOSE US (exactly 4 points) ════════════════════ */}
      <section className="about-section bg-pastel-alt" id="why" ref={whyRef}>
        <Container>
          <div className="text-center">
            <span className="section-inner-badge badge-blue"><i className="fa-solid fa-trophy" /> Core Values</span>
            <h2 className="section-title">Why Choose Us</h2>
            <p className="section-sub mx-auto">Discover the benefits of trading locally.</p>
          </div>
          <div className="why-grid mt-5">
            {whyItems.map((w, i) => (
              <div className={`why-card ${whyVisible ? 'about-reveal' : ''}`}
                   key={w.title}
                   style={{ animationDelay: `${i * 0.1}s`, opacity: whyVisible ? undefined : 0, background: '#fff' }}>
                <div className="why-check" style={{ background: w.bg, color: w.text }}>
                  <i className={`fa-solid ${w.icon}`} />
                </div>
                <div>
                  <div className="why-title">{w.title}</div>
                  <div className="why-desc">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ════════════════════ CTA BANNER ════════════════════ */}
      <section className="about-section" style={{ paddingBottom: 80 }} ref={ctaRef}>
        <Container>
          <div className={`cta-banner ${ctaVisible ? 'about-reveal' : ''}`} style={{ opacity: ctaVisible ? undefined : 0 }}>
            <h2>Ready to experience it yourself?</h2>
            <p>Join thousands of students already buying and selling on CampusCart.</p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/register" className="btn-cta">
                <i className="fa-solid fa-rocket" /> Get Started — It's Free
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};

export default About;
