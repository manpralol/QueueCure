import React, { useState, useEffect } from 'react';
import styles from './PatientDashboard.module.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import { patientService } from '../../services/patientService';
import { notificationService } from '../../services/notificationService';
import { appointmentService } from '../../services/appointmentService';
import { store } from '../../store/demoStore';
import { Toast } from '../../components/Toast/Toast';

const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. Arjun Mehta', specialty: 'General' },
  { id: 2, name: 'Dr. Preet Kaur', specialty: 'Cardiology' }
];

const PatientDashboard = ({ user, onLogout }) => {
  const [activePanel, setActivePanel] = useState('overview');
  const [history, setHistory] = useState(() => store.getPatientHistory(user?.name || 'Priya Sharma'));
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  // My Appointments state
  const [myAppointments, setMyAppointments] = useState(() => 
    store.appointments.filter(a => a.patientName === (user?.name || 'Priya Sharma'))
  );
  const [apptsLoading, setApptsLoading] = useState(false);
  const [apptsError, setApptsError] = useState(null);

  // Book Appointment state
  const [doctors, setDoctors] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  
  // Book Form state
  const [bookData, setBookData] = useState({
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '9:00 AM',
    age: '',
    symptoms: '',
    isPrivate: false
  });
  
  const [liveUrgency, setLiveUrgency] = useState({ label: '', score: 1 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [notifs] = await Promise.all([
        notificationService.getNotifications()
      ]);
      setNotifications(notifs);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activePanel === 'appointments') {
      setMyAppointments(store.appointments.filter(a => a.patientName === (user?.name || 'Priya Sharma')));
    } else if (activePanel === 'history') {
      setHistory(store.getPatientHistory(user?.name || 'Priya Sharma'));
    }
  }, [activePanel, user?.name]);

  useEffect(() => {
    if (activePanel === 'notifications') {
      const userId = user?.id || 3;
      const userNotifs = store.getNotificationsForUser(userId);
      setNotifications([...userNotifs].reverse());
      // Mark as read
      store.markNotificationsRead(userId);
    }
  }, [activePanel, user?.id]);

  // Fetch Doctors for Booking panel
  useEffect(() => {
    if (activePanel === 'book' && doctors.length === 0) {
      setDoctors(MOCK_DOCTORS);
      setBookData(prev => ({ ...prev, doctorId: MOCK_DOCTORS[0].id }));
    }
  }, [activePanel, doctors.length]);

  const [cancelFormId, setCancelFormId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReschedule, setCancelReschedule] = useState('');

  const confirmCancel = (id) => {
    store.cancelByPatient(id, cancelReason, cancelReschedule);
    setMyAppointments(store.appointments.filter(a => a.patientName === (user?.name || 'Priya Sharma')));
    setCancelFormId(null);
    setCancelReason('');
    setCancelReschedule('');
    showToast("Cancellation request sent to reception.");
  };

  const handleSymptomsChange = (e) => {
    const val = e.target.value;
    setBookData({...bookData, symptoms: val});
    
    const keywords = val.toLowerCase();
    let score = 1, label = '';
    if (/(fever|chest|bleed|breath|seizure|stroke)/i.test(keywords)) { score = 5; label = 'Acute'; }
    else if (/(vomit|severe|infection|fracture)/i.test(keywords)) { score = 4; label = 'Urgent'; }
    else if (/(cough|headache|rash|dizz|back pain)/i.test(keywords)) { score = 3; label = 'Medium'; }
    else if (val.trim().length > 0) { score = 1; label = 'Routine'; }
    
    setLiveUrgency({ label, score });
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    try {
      if (!bookData.doctorId || !bookData.date || !bookData.timeSlot) {
        throw new Error("Please fill in all required fields (Doctor, Date, Time Slot).");
      }
      
      const selectedDoc = doctors.find(d => d.id === Number(bookData.doctorId));
      
      let score = 1;
      let label = 'Routine';
      const sym = bookData.symptoms.toLowerCase();
      if (sym.match(/fever|chest|pain|bleed/)) {
        score = 5; label = 'Acute';
      } else if (sym.match(/vomit|severe|infection/)) {
        score = 4; label = 'Urgent';
      } else if (sym.match(/cough|headache|rash/)) {
        score = 3; label = 'Medium';
      }

      // 1. Post to backend
      let newApptId = Date.now();
      try {
        const backendRes = await appointmentService.bookAppointment({
          doctorId: Number(bookData.doctorId),
          date: bookData.date,
          timeSlot: bookData.timeSlot,
          symptoms: bookData.symptoms,
          isPrivate: bookData.isPrivate
        });
        if (backendRes && backendRes.appointmentId) {
          newApptId = backendRes.appointmentId;
        }
      } catch (err) {
        console.warn('Failed to book on backend, booking locally', err);
      }

      // 2. Save in local store
      console.log('Booking as:', user?.name);
      store.addAppointment({
        id: newApptId,
        doctorId: Number(bookData.doctorId),
        doctorName: selectedDoc ? selectedDoc.name : 'Unknown Doctor',
        date: bookData.date,
        timeSlot: bookData.timeSlot,
        age: Number(bookData.age) || null,
        symptoms: bookData.symptoms,
        isPrivate: bookData.isPrivate,
        urgencyLabel: label,
        urgencyScore: score,
        patientName: user?.name,
        patientId: user?.id || 3
      });
      
      setMyAppointments(store.appointments.filter(a => a.patientName === (user?.name || 'Priya Sharma')));
      
      // Simulate switching to appointments panel
      setActivePanel('appointments');
      
      // Reset form
      setBookData(prev => ({ ...prev, symptoms: '', age: '', isPrivate: false }));
      setLiveUrgency({ label: '', score: 1 });
      
      // Show success message temporarily
      showToast('Appointment booked successfully!');
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const panelTitles = {
    overview: 'My Health Dashboard',
    appointments: 'My Appointments',
    book: 'Book New Appointment',
    history: 'Medical Records',
    private: 'Private Consultations',
    map: 'Clinic Directions',
    notifications: 'My Notifications'
  };

  const upcomingAppointments = myAppointments.filter(appt => appt.status !== 'cancelled' && appt.status !== 'completed');
  const nextAppt = upcomingAppointments[0];

  return (
    <div className={styles.dashboardPage}>
      <Sidebar 
        role="patient" 
        user={user} 
        activePanel={activePanel} 
        onPanelChange={setActivePanel} 
      />
      
      <div className={styles.mainWrap}>
        <div className={styles.topbar}>
          <span className={styles.topbarTitle}>{panelTitles[activePanel]}</span>
          <div className={styles.topbarRight}>
            <button className={styles.notifBtn}>
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /></svg>
              <div className={styles.notifDot}></div>
            </button>
            <button className="theme-btn" style={{ marginLeft: '10px' }} onClick={() => document.querySelector('.theme-btn')?.click()}>
               <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            </button>
          </div>
        </div>

        <div className={styles.contentArea}>
          {/* OVERVIEW */}
          <section className={`${styles.panel} ${activePanel === 'overview' ? styles.active : ''}`}>
            <div className={styles.greeting}>
              <h2>Welcome, <i>{user?.name}.</i></h2>
              <p>{currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Your health at a glance</p>
            </div>
            
            {nextAppt ? (
              <div className={styles.statusBanner}>
                 <div className={styles.statusInfo}>
                    <h4>Upcoming Appointment [Token: {nextAppt.tokenNumber || ('T-' + String(nextAppt.id).padStart(3, '0'))}] — {nextAppt.timeSlot} Slot</h4>
                    <p>{nextAppt.doctorName} is ready. Head to <strong>Room 01</strong> on the first floor.</p>
                 </div>
                 <button className={styles.trackBtn} onClick={() => showToast('Tracking active.')}>Track My Turn</button>
              </div>
            ) : (
              <div className={styles.statusBanner} style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                 <div className={styles.statusInfo}>
                    <h4 style={{ color: 'var(--text)' }}>No upcoming appointments</h4>
                    <p style={{ color: 'var(--text-mid)' }}>Book one below to schedule a visit with our doctors.</p>
                 </div>
                 <button className={styles.trackBtn} style={{ background: 'var(--pat-color)', color: 'white' }} onClick={() => setActivePanel('book')}>Book Now</button>
              </div>
            )}

            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                   <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div className={styles.kpiLabel}>Next Appointment</div>
                <div className={styles.kpiValue}>{nextAppt ? nextAppt.timeSlot : 'None'}</div>
                <div className={styles.kpiDelta}>{nextAppt ? 'Upcoming' : 'No active bookings'}</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                   <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className={styles.kpiLabel}>Historical Records</div>
                <div className={styles.kpiValue}>4</div>
                <div className={styles.kpiDelta}>Latest: 12 Mar</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                   <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className={styles.kpiLabel}>Health Insights</div>
                <div className={styles.kpiValue}>Normal</div>
                <div className={styles.kpiDelta}>Stable vitals</div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <span className={styles.tableCardTitle}>Upcoming Consultations</span>
              </div>
              <table>
                <thead>
                  <tr><th>Token</th><th>Doctor</th><th>Reason</th><th>Time</th><th>Room</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {myAppointments.filter(appt => appt.status !== 'cancelled').map(appt => (
                    <tr key={appt.id}>
                      <td><span className="badge" style={{background:'var(--pat-bg)', color:'var(--pat-color)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{appt.tokenNumber || ('T-' + String(appt.id).padStart(3, '0'))}</span></td>
                      <td><strong>{appt.doctorName}</strong></td>
                      <td>{appt.isPrivate ? 'Private Consultation' : appt.symptoms || '—'} · {appt.urgencyLabel}</td>
                      <td>{appt.timeSlot}</td>
                      <td>01</td>
                      <td>
                         <span className={`${styles.pill} ${appt.status === 'confirmed' ? styles.pillConfirmed : styles.pillUrgent}`}>
                           {appt.status.replace('_', ' ')}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {myAppointments.filter(appt => appt.status !== 'cancelled').length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>
                        No upcoming appointments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* APPOINTMENTS */}
          <section className={`${styles.panel} ${activePanel === 'appointments' ? styles.active : ''}`}>
             <div className={styles.greeting}><h2>My <i>Appointments</i></h2><p>View, reschedule or cancel your bookings</p></div>
             
             {apptsError && <div style={{ color: 'red', margin: '16px 0', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>{apptsError}</div>}
             
             <div className={styles.tableCard}>
                {apptsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--pat-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '16px' }}>Loading your appointments...</p>
                  </div>
                ) : myAppointments.length === 0 && !apptsError ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                    You have no upcoming appointments.
                  </div>
                ) : (
                  <table>
                     <thead><tr><th>Token</th><th>Date</th><th>Doctor</th><th>Time</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
                     <tbody>
                        {myAppointments.map(appt => (
                          <React.Fragment key={appt.id}>
                            <tr>
                              <td><span className="badge" style={{background:'var(--pat-bg)', color:'var(--pat-color)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{appt.tokenNumber || ('T-' + String(appt.id).padStart(3, '0'))}</span></td>
                              <td>{new Date(appt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td>{appt.doctorName}</td>
                              <td>{appt.timeSlot}</td>
                              <td>{appt.isPrivate ? <span style={{color: 'purple'}}>Private</span> : (appt.symptoms || "—")}</td>
                              <td>
                                <span className={`${styles.pill} ${appt.status === 'scheduled' || appt.status === 'confirmed' ? styles.pillConfirmed : appt.status === 'cancellation_requested' || appt.status === 'cancelled' ? styles.pillUrgent : styles.pillUrgent}`}>
                                  {appt.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                {appt.status !== 'cancelled' && appt.status !== 'cancellation_requested' && (
                                  <button className="btn btn-secondary btn-xs" style={{color: 'red'}} onClick={() => { setCancelFormId(appt.id); setCancelReason(''); setCancelReschedule(''); }}>Cancel</button>
                                )}
                              </td>
                            </tr>
                            {cancelFormId === appt.id && (
                              <tr>
                                <td colSpan="7" style={{ background: 'var(--surface2)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <textarea 
                                      placeholder="Why are you cancelling?" 
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                                      rows="2"
                                    ></textarea>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      <select 
                                        value={cancelReschedule} 
                                        onChange={(e) => setCancelReschedule(e.target.value)}
                                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                      >
                                        <option value="">No reschedule needed</option>
                                        <option value="9:00 AM">9:00 AM</option>
                                        <option value="9:15 AM">9:15 AM</option>
                                        <option value="10:00 AM">10:00 AM</option>
                                        <option value="11:00 AM">11:00 AM</option>
                                        <option value="2:00 PM">2:00 PM</option>
                                        <option value="3:00 PM">3:00 PM</option>
                                        <option value="4:00 PM">4:00 PM</option>
                                      </select>
                                      <button className="btn btn-primary btn-sm" onClick={() => confirmCancel(appt.id)} disabled={!cancelReason.trim()}>Confirm Cancellation</button>
                                      <button className="btn btn-secondary btn-sm" onClick={() => setCancelFormId(null)}>Back</button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                     </tbody>
                  </table>
                )}
             </div>
          </section>

          {/* HISTORY */}
          <section className={`${styles.panel} ${activePanel === 'history' ? styles.active : ''}`}>
             <div className={styles.greeting}><h2>Your <i>Medical History</i></h2><p>Your longitudinal records from all clinic visits</p></div>
             <div className={styles.tableCard} style={{ padding: '22px' }}>
                {history.length === 0 ? <p style={{ color: 'var(--gray-500)' }}>No history available.</p> : history.map((entry, idx) => (
                   <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px', background: 'var(--surface2)', color: 'var(--text)' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--doc-color)' }}>{entry.date} - {entry.doctor}</div>
                      <div style={{ marginBottom: '6px' }}><strong>Diagnosis:</strong> {entry.diagnosis}</div>
                      <div style={{ marginBottom: '6px' }}><strong>Prescription:</strong> {entry.prescription}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}><strong>Notes:</strong> {entry.notes}</div>
                   </div>
                ))}
             </div>
          </section>

          {/* PRIVATE BOOKING */}
          <section className={`${styles.panel} ${activePanel === 'private' ? styles.active : ''}`}>
            <div className={styles.greeting}>
              <h2>Private <i>Booking</i></h2>
              <p>Appointments for sensitive consultations · Hidden from non-clinical staff</p>
            </div>
            
            <div className={styles.privCard}>
              <div className={styles.privIcon}>
                <svg viewBox="0 0 24 24"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="2" /><path d="M12 11V17M12 7H12.01" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div className={styles.privTitle}>Data Privacy Guarantee</div>
                <div className={styles.privText}>The reason for this visit and your notes will be encrypted and visible only to the doctor. Reception will only see "Private Consult".</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <div className={styles.formGroup}>
                <label>Sensitive Category</label>
                <select>
                  <option>Mental Health / Counselling</option>
                  <option>Sexual Health</option>
                  <option>Sensitive Recovery</option>
                  <option>Other Confidential</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Dr. Preference (Optional)</label>
                <select><option>No preference</option><option>Dr. Mehta</option><option>Dr. Kapoor</option></select>
              </div>
              <div className={styles.formGroup}>
                <label>Confidential Notes (Encrypted)</label>
                <textarea rows="3" placeholder="Describe symptoms or reason for visit..."></textarea>
              </div>
              <button className={styles.formSubmit} onClick={() => showToast('Private booking submitted securely.')}>Request Private Slot</button>
            </div>
          </section>

          {/* BOOK APPOINTMENT */}
          <section className={`${styles.panel} ${activePanel === 'book' ? styles.active : ''}`}>
             <div className={styles.greeting}>
               <h2>Book <i>Appointment</i></h2>
               <p>Schedule a visit with one of our doctors</p>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '20px' }}>
               <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                 {bookingError && <div style={{ color: 'red', margin: '0 0 16px 0', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>{bookingError}</div>}
                 
                 <form onSubmit={handleBookSubmit}>
                   <div className={styles.formGroup}>
                     <label>Select Doctor</label>
                     <select 
                        value={bookData.doctorId} 
                        onChange={(e) => setBookData({...bookData, doctorId: e.target.value})}
                     >
                        {!bookData.doctorId && <option value="" disabled>Loading doctors...</option>}
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
                        ))}
                     </select>
                   </div>
                   
                   <div className={styles.formGroup}>
                     <label>Preferred Date</label>
                     <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]} 
                        value={bookData.date}
                        onChange={(e) => setBookData({...bookData, date: e.target.value})}
                        required
                     />
                   </div>
                   
                   <div className={styles.formGroup}>
                     <label>Time Slot</label>
                     <select 
                        value={bookData.timeSlot} 
                        onChange={(e) => setBookData({...bookData, timeSlot: e.target.value})}
                        required
                     >
                       <option value="9:00 AM">9:00 AM</option>
                       <option value="9:15 AM">9:15 AM</option>
                       <option value="10:00 AM">10:00 AM</option>
                       <option value="11:00 AM">11:00 AM</option>
                       <option value="2:00 PM">2:00 PM</option>
                       <option value="3:00 PM">3:00 PM</option>
                       <option value="4:00 PM">4:00 PM</option>
                     </select>
                   </div>
                   
                   <div className={styles.formGroup}>
                     <label>Age</label>
                     <input 
                        type="number" 
                        min="0"
                        placeholder="Patient Age"
                        value={bookData.age}
                        onChange={(e) => setBookData({...bookData, age: e.target.value})}
                     />
                   </div>

                    <div className={styles.formGroup}>
                     <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Symptoms / Reason for Visit</span>
                        {liveUrgency.label && (
                           <span className={`${styles.pill} ${liveUrgency.score >= 4 ? styles.pillUrgent : liveUrgency.score >= 3 ? styles.pillConfirmed : ''}`} style={{ marginLeft: '10px', fontSize: '0.75rem', padding: '2px 8px' }}>
                             {liveUrgency.label} Prediction
                           </span>
                        )}
                     </label>
                     <textarea 
                        rows="3" 
                        placeholder="Please describe..."
                        value={bookData.symptoms}
                        onChange={handleSymptomsChange}
                     ></textarea>
                   </div>
                   
                   <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                     <input 
                        type="checkbox" 
                        id="isPrivate"
                        checked={bookData.isPrivate}
                        onChange={(e) => setBookData({...bookData, isPrivate: e.target.checked})}
                        style={{ width: 'auto' }}
                     />
                     <label htmlFor="isPrivate" style={{ margin: 0 }}>Mark as Private Consultation (Only visible to doctor)</label>
                   </div>
                   
                   <button 
                      type="submit" 
                      className={styles.formSubmit} 
                      disabled={bookingLoading}
                      style={{ opacity: bookingLoading ? 0.7 : 1 }}
                   >
                     {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                   </button>
                 </form>
               </div>
               
               <div style={{ background: 'var(--pat-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                 <div style={{ fontFamily: 'var(--sans)', fontSize: '1rem', color: 'var(--pat-color)', marginBottom: '12px', fontWeight: 'bold' }}>AI Triage Preview</div>
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-mid)', lineHeight: '1.6', marginBottom: '16px' }}>
                   Ensure you are as specific as possible with your symptoms. If you require emergency assistance, please bypass this app and call emergency services directly.
                 </p>
                 <div style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--pat-color)' }}>
                   <b>Pro-tip:</b> Booking an early slot usually runs strictly on time. Later slots may experience minor operational delays.
                 </div>
               </div>
             </div>
          </section>

          {/* MAP */}
          <section className={`${styles.panel} ${activePanel === 'map' ? styles.active : ''}`}>
             <div className={styles.greeting}><h2>Clinic <i>Directions</i></h2><p>Find your way to the consultation room</p></div>
             <div className={styles.tableCard} style={{ padding: '22px' }}>
                <div className={styles.statusInfo} style={{ marginBottom: '22px' }}>
                   <h4>Heading to Room 01?</h4>
                   <p>Located on Phase 1 floor, directly across from the reception desk.</p>
                </div>
                <div className={styles.roomGrid}>
                    <div className={`${styles.room} ${styles.target}`}><div className={styles.roomNum}>01</div><div className={styles.roomStatus}>Your Room</div></div>
                    <div className={styles.room}><div className={styles.roomNum}>02</div><div className={styles.roomStatus}>Next Door</div></div>
                    <div className={styles.room}><div className={styles.roomNum}>03</div><div className={styles.roomStatus}>Hallway</div></div>
                    <div className={styles.room}><div className={styles.roomNum}>04</div><div className={styles.roomStatus}>Hallway</div></div>
                </div>
             </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className={`${styles.panel} ${activePanel === 'notifications' ? styles.active : ''}`}>
              <div className={styles.greeting}><h2>Notifications</h2></div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', color: 'var(--gray-500)' }}>You have no notifications.</div>
                ) : notifications.map((notif) => (
                  <div key={notif.id} className={styles.notifItem}>
                    <div>
                      <div className={styles.notifTitle} style={{textTransform:'capitalize'}}>{notif.type} Update</div>
                      <div className={styles.notifText}>{notif.message}</div>
                      <div className={styles.notifTime}>{notif.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
          </section>
        </div>
      </div>
      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  );
};

export default PatientDashboard;
