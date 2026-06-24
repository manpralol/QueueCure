import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import styles from './LandingPage.module.css';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import Modal from '../../components/Modal/Modal';
import { authService } from '../../services/authService';

const LandingPage = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const setAnimRef = useIntersectionObserver({ threshold: 0.1 });

  const [modalRole, setModalRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (role) => {
    setModalRole(role);
    setIsModalOpen(true);
  };

  const handleModalLogin = (role, userData) => {
    onLogin(role, userData);
  };

  return (
    <div className={styles.pageHome}>
      <nav className={styles.landNav}>
        <a className={styles.navLogo} href="#">
          <div className={styles.navLogoMark}></div>
          <span className={styles.navLogoText}>QueueTonic</span>
        </a>
        <ul className={styles.navLinks}>
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#" className={styles.navCta} onClick={() => openModal('patient')}>Book Appointment</a></li>
        </ul>
        <div className={styles.navRight}>
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </button>
        </div>
      </nav>

      <section className={styles.hero} id="home-top">
        <div className={styles.heroLeft}>
          <span className={`${styles.heroEyebrow} fade-up`} ref={setAnimRef}>Healthcare Scheduling Platform</span>
          <h1 className={`${styles.heroTitle} fade-up delay-1`} ref={setAnimRef}>
            Appointments,<br /><span className={styles.accentWord}>finally</span><br />effortless.
          </h1>
          <p className={`${styles.heroSubtitle} fade-up delay-2`} ref={setAnimRef}>
            QueueTonic brings calm to healthcare scheduling — connecting doctors, receptionists, and patients in one clean, intelligent platform.
          </p>
          <div className={`${styles.heroStats} fade-up delay-3`} ref={setAnimRef}>
            <div className={styles.statItem}><span className={styles.statNumber}>98%</span><span className={styles.statLabel}>Scheduling Accuracy</span></div>
            <div className={styles.statItem}><span className={styles.statNumber}>3×</span><span className={styles.statLabel}>Faster Check-In</span></div>
            <div className={styles.statItem}><span className={styles.statNumber}>Zero</span><span className={styles.statLabel}>Double Bookings</span></div>
          </div>
        </div>
        <div className={`${styles.heroRight} fade-up delay-2`} ref={setAnimRef}>
          <div className={styles.loginHeader}>
            <p>Portal Access</p>
            <h2>Sign in to your workspace</h2>
          </div>
          <div className={styles.loginCards}>
            <a href="#" className={`${styles.loginCard} ${styles.doc}`} onClick={() => openModal('doctor')}>
              <div className={styles.cardLeft}>
                <div className={`${styles.cardIcon} ${styles.doctor}`} style={{ background: 'var(--doc-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--doc-color)" strokeWidth="1.8"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <div className={styles.cardInfo}><h3>Doctor</h3><p>Schedule, patient records &amp; analytics</p></div>
              </div>
              <div className={styles.cardArrow}><svg viewBox="0 0 12 12"><path d="M2 6h8M7 3l3 3-3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            </a>
            <a href="#" className={`${styles.loginCard} ${styles.rec}`} onClick={() => openModal('receptionist')}>
              <div className={styles.cardLeft}>
                <div className={`${styles.cardIcon} ${styles.receptionist}`} style={{ background: 'var(--rec-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--rec-color)" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h4M8 17h8"/></svg>
                </div>
                <div className={styles.cardInfo}><h3>Receptionist</h3><p>Queue control &amp; clinic operations</p></div>
              </div>
              <div className={styles.cardArrow}><svg viewBox="0 0 12 12"><path d="M2 6h8M7 3l3 3-3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            </a>
            <a href="#" className={`${styles.loginCard} ${styles.pat}`} onClick={() => openModal('patient')}>
              <div className={styles.cardLeft}>
                <div className={`${styles.cardIcon} ${styles.patient}`} style={{ background: 'var(--pat-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--pat-color)" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <div className={styles.cardInfo}><h3>Patient <span className={styles.badge}>Book Now</span></h3><p>Appointments, queue &amp; health records</p></div>
              </div>
              <div className={styles.cardArrow}><svg viewBox="0 0 12 12"><path d="M2 6h8M7 3l3 3-3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            </a>
          </div>
          <p className={styles.loginNote}>New clinic? <a href="#">Register your practice</a> — it takes 2 minutes.</p>
        </div>
      </section>

      <section className={styles.landSection} id="features">
        <div className={styles.sectionEyebrow} ref={setAnimRef}>Platform Features</div>
        <h2 className={styles.sectionTitle} ref={setAnimRef}>Intelligence built into every interaction.</h2>
        <p className={styles.sectionSub} ref={setAnimRef}>Designed for each role — each person sees exactly what they need, nothing they don't.</p>
        <div className={styles.featuresLegend} ref={setAnimRef}>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--doc-color)' }}></div>Doctor</div>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--rec-color)' }}></div>Receptionist</div>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: 'var(--pat-color)' }}></div>Patient</div>
        </div>
        <div className={styles.featuresGrid} ref={setAnimRef}>
          <FeatureItem title="Smart Gap Fill" tags={[{ label: 'Receptionist', role: 'rec' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>} desc="Cancellations auto-trigger a waitlist sweep. Next eligible patient gets a WhatsApp/SMS offer — slot filled in minutes." refAnim={setAnimRef} />
          <FeatureItem title="WhatsApp Bot" tags={[{ label: 'Doctor', role: 'doc' }, { label: 'Patient', role: 'pat' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} desc="Patients book, reschedule, and check queue position via WhatsApp. Doctors receive urgent flags. No app download needed." refAnim={setAnimRef} />
          <FeatureItem title="Patient History" tags={[{ label: 'Doctor', role: 'doc' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>} desc="Complete visit timeline, prescriptions, and notes visible to the doctor before the patient enters. Private by default." refAnim={setAnimRef} />
          <FeatureItem title="Urgency Intelligence" tags={[{ label: 'Doctor', role: 'doc' }, { label: 'Receptionist', role: 'rec' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} desc="Patients describe symptoms during booking. AI scores urgency — acute cases auto-prioritised to the earliest available slot." refAnim={setAnimRef} />
          <FeatureItem title="Private Slots" tags={[{ label: 'Patient', role: 'pat' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>} desc="Sensitive consultations booked as private — reason hidden from reception. Only the doctor sees the nature of the visit." refAnim={setAnimRef} />
          <FeatureItem title="Multi-Channel Alerts" tags={[{ label: 'Doctor', role: 'doc' }, { label: 'Receptionist', role: 'rec' }, { label: 'Patient', role: 'pat' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>} desc="WhatsApp, SMS, and email — each role receives context-appropriate messages with zero overlap or duplication." refAnim={setAnimRef} />
          <FeatureItem title="Doctor Availability Shift" tags={[{ label: 'Receptionist', role: 'rec' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>} desc="If a doctor is absent, patients are automatically redistributed to available colleagues with one confirmation click." refAnim={setAnimRef} />
          <FeatureItem title="One-Tap Reschedule" tags={[{ label: 'Patient', role: 'pat' }, { label: 'Receptionist', role: 'rec' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} desc="When an appointment overruns, waiting patients receive an instant reschedule offer — no standing in queue required." refAnim={setAnimRef} />
          <FeatureItem title="Interactive Clinic Map" tags={[{ label: 'Doctor', role: 'doc' }, { label: 'Receptionist', role: 'rec' }]} icon={<svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} desc="Visual floor map with real-time room status and AI-predicted consultation durations — so no one wanders lost." refAnim={setAnimRef} />
        </div>
      </section>

      <section className={styles.landSection} id="how-it-works" style={{ background: 'var(--black)', borderTop: '1px solid var(--gray-200)' }}>
        <div className={styles.sectionEyebrow} style={{ color: 'var(--accent-mid)' }} ref={setAnimRef}>Process</div>
        <h2 className={styles.sectionTitle} style={{ color: 'var(--white)' }} ref={setAnimRef}>From booking to consultation in minutes.</h2>
        <p className={styles.sectionSub} style={{ color: 'var(--gray-400)' }} ref={setAnimRef}>A streamlined flow that respects everyone's time — patients, receptionists, and doctors alike.</p>
        <div className={styles.stepsContainer}>
          <Step num="1" title="Patient Books" desc="Choose a doctor, describe symptoms, pick a slot. Urgency is scored instantly. Takes under 60 seconds." refAnim={setAnimRef} />
          <Step num="2" title="Clinic Confirms" desc="Receptionist reviews the queue. High-urgency cases are flagged. Patient gets instant confirmation via WhatsApp." refAnim={setAnimRef} />
          <Step num="3" title="Day-of Alerts" desc="Reminders sent automatically. Live queue position shown in real-time. One-tap reschedule if delays occur." refAnim={setAnimRef} />
          <Step num="4" title="Doctor Consults" desc="Full patient history loaded before entry. Private slots respected. Visit logged — cycle repeats seamlessly." refAnim={setAnimRef} />
        </div>
      </section>

      <section id="about" className={styles.aboutLayout}>
        <div className={styles.aboutLeft}>
          <div className={styles.sectionEyebrow} ref={setAnimRef}>Why QueueTonic</div>
          <h2 className={styles.sectionTitle} ref={setAnimRef}>Designed around trust. Built for reliability.</h2>
          <p className={styles.sectionSub} ref={setAnimRef}>Healthcare scheduling is high-stakes. We treat it that way — every decision prioritises uptime, data security, and clinical accuracy.</p>
          <br /><p className={styles.sectionSub} ref={setAnimRef}>Built in close collaboration with clinic administrators and practitioners who were tired of clunky, overengineered tools that slowed them down.</p>
        </div>
        <div className={styles.aboutRight}>
          <TrustItem title="HIPAA-aligned data practices" desc="Patient data encrypted at rest and in transit. No data sold, no third-party sharing — ever." refAnim={setAnimRef} />
          <TrustItem title="99.9% uptime guarantee" desc="Mission-critical infrastructure with redundant failover — your clinic never goes dark." refAnim={setAnimRef} />
          <TrustItem title="Strict role-based access" desc="Doctors see clinical data. Receptionists see schedules only. Patients see their own records exclusively." refAnim={setAnimRef} />
          <TrustItem title="Dedicated onboarding support" desc="Every clinic gets a human onboarding specialist — not a chatbot, not a help article." refAnim={setAnimRef} />
        </div>
      </section>

      <section id="cta" className={styles.landSection} style={{ background: 'var(--off-white)', borderTop: '1px solid var(--gray-200)', textAlign: 'center' }}>
        <div className={styles.sectionEyebrow} style={{ justifyContent: 'center' }} ref={setAnimRef}><span>Get Started</span></div>
        <h2 className={styles.sectionTitle} style={{ margin: '0 auto 20px', textAlign: 'center', maxWidth: '600px' }} ref={setAnimRef}>Ready to transform your clinic?</h2>
        <p className={styles.sectionSub} style={{ margin: '0 auto 52px', textAlign: 'center' }} ref={setAnimRef}>Join forward-thinking practices who've moved past the waiting-room chaos. Set up in one afternoon.</p>
        <div className={styles.ctaButtons} ref={setAnimRef}>
          <a href="#" className="btn btn-primary" onClick={() => openModal('patient')}>Book a Demo</a>
          <a href="#" className="btn btn-secondary" onClick={() => openModal('doctor')}>Doctor Login</a>
        </div>
      </section>

      <footer className={styles.landFooter}>
        <a className={styles.footerLogo} href="#"><div className={styles.footerLogoMark}></div>QueueTonic</a>
        <ul className={styles.footerLinks}>
          <li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Service</a></li>
          <li><a href="#">Security</a></li><li><a href="#">Contact</a></li><li><a href="#">Support</a></li>
        </ul>
        <span className={styles.footerCopy}>© 2026 QueueTonic · TechBlitz26 · snack overflow</span>
      </footer>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        role={modalRole} 
        onLogin={handleModalLogin}
      />
    </div>
  );
};

const FeatureItem = ({ title, tags, icon, desc, refAnim }) => (
  <div className={styles.featureItem} ref={refAnim}>
    <div className={styles.featureTags}>
      {tags.map((t, i) => (
        <span key={i} className={`${styles.ftag} ${styles[t.role]}`} style={{ backgroundColor: `var(--${t.role}-bg)`, color: `var(--${t.role}-color)` }}>{t.label}</span>
      ))}
    </div>
    <div className={styles.featureIconWrap}>{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const Step = ({ num, title, desc, refAnim }) => (
  <div className={styles.step} ref={refAnim}>
    <span className={styles.stepNum}>{num}</span>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const TrustItem = ({ title, desc, refAnim }) => (
  <div className={styles.trustItem} ref={refAnim}>
    <div className={styles.trustDot}></div>
    <div>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  </div>
);

export default LandingPage;
