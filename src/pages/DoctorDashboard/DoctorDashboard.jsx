import React, { useState, useEffect } from 'react';
import styles from './DoctorDashboard.module.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import { patientService } from '../../services/patientService';
import { notificationService } from '../../services/notificationService';
import { appointmentService } from '../../services/appointmentService';
import { store } from '../../store/demoStore';
import { Toast } from '../../components/Toast/Toast';

const DoctorDashboard = ({ user, onLogout }) => {
  const [activePanel, setActivePanel] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  
  const getFilteredQueue = () => {
    return store.getQueue().filter(a => a.status === 'confirmed' || a.status === 'in_progress').sort((a,b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });
  };
  
  const [queue, setQueue] = useState(() => getFilteredQueue());
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const showToast = (msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };
  
  const [reschedulingId, setReschedulingId] = useState(null);
  const [newSlot, setNewSlot] = useState('');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState([]);
  const [selectedPatientName, setSelectedPatientName] = useState('');

  const openHistoryDrawer = (name) => {
    setSelectedPatientName(name);
    setSelectedPatientHistory(store.getPatientHistory(name));
    setHistoryDrawerOpen(true);
  };

  // Polling sync
  useEffect(() => {
    const pollAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const doctorId = 1; // Demo doctor ID
        const backendAppts = await appointmentService.getAppointments(today, doctorId);
        
        // Map backend appointments to store & dashboard formats
        const mappedAppts = backendAppts.map(a => ({
          id: a.id,
          patientName: a.patientName,
          patientId: a.patientId || 3,
          doctorId: a.doctorId || 1,
          doctorName: a.doctorName || 'Dr. Arjun Mehta',
          date: today,
          timeSlot: a.time || a.timeSlot,
          time: a.time || a.timeSlot, // for DoctorDashboard compatibility
          type: a.isPrivate ? 'Private Consultation' : (a.symptoms || 'General Checkup'), // for DoctorDashboard compatibility
          symptoms: a.symptoms || '',
          urgencyScore: a.urgencyScore || 1,
          urgencyLabel: a.urgencyLabel || 'Routine',
          urgency: a.urgencyLabel || 'Routine', // for DoctorDashboard compatibility
          isPrivate: a.isPrivate || false,
          status: a.status
        }));
        
        // Merge with local appointments keeping local custom patient names and tokens as source of truth
        const localById = Object.fromEntries(store.appointments.map(a => [a.id, a]));
        const merged = mappedAppts.map(ma => {
          const local = localById[ma.id];
          if (local) {
            return {
              ...ma,
              patientName: local.patientName || ma.patientName,
              tokenNumber: local.tokenNumber || ma.tokenNumber
            };
          }
          return ma;
        });

        // Merge with local walk-ins to avoid losing data
        const localWalkIns = store.appointments.filter(la => la.isWalkIn);
        const finalMerged = [
          ...merged,
          ...localWalkIns.filter(la => !merged.some(ma => ma.id === la.id))
        ];
        
        store.appointments = finalMerged;
        store.save();
        
        // Ensure all compatibility fields exist on the appointments state
        const compatMerged = finalMerged.map(a => ({
          ...a,
          time: a.time || a.timeSlot,
          urgency: a.urgencyLabel || a.urgency || 'Routine',
          type: a.type || (a.isPrivate ? 'Private Consultation' : (a.symptoms || 'General Checkup'))
        })).sort((a, b) => {
          if (b.urgencyScore !== a.urgencyScore) {
            return b.urgencyScore - a.urgencyScore;
          }
          return (a.timeSlot || '').localeCompare(b.timeSlot || '');
        });
        
        setAppointments(compatMerged);
        setQueue(getFilteredQueue());
      } catch (err) {
        console.error('Failed to poll appointments from backend:', err);
      }
    };

    // Initial fetch
    pollAppointments();

    const interval = setInterval(pollAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [hist, notifs] = await Promise.all([
        patientService.getPatientHistory('priya'),
        notificationService.getNotifications()
      ]);
      setAppointments([]);
      setHistory(hist);
      setNotifications(notifs);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activePanel === 'schedule' || activePanel === 'overview') {
      setQueue([...getFilteredQueue()]);
    } else if (activePanel === 'notifications') {
      const docNotifs = store.notifications.filter(n => n.userId === 'doctor');
      setNotifications([...docNotifs].reverse());
      store.markNotificationsRead('doctor');
    }
  }, [activePanel]);

  const handleStartConsultation = (id, name) => {
    store.startConsultation(id);
    setQueue([...getFilteredQueue()]);
    showToast('Consultation started.');
  };

  const handleCancel = (id) => {
    store.cancelAppointment(id);
    setQueue([...getFilteredQueue()]);
    showToast('Appointment cancelled. Patient notified.');
  };

  const handleReschedule = (id) => {
    store.rescheduleAppointment(id, newSlot);
    setReschedulingId(null);
    setQueue([...getFilteredQueue()]);
  };

  const handleUpdateUrgency = (id, label) => {
    let score = 1;
    if (label === 'Acute') score = 5;
    else if (label === 'Urgent') score = 4;
    else if (label === 'Medium') score = 3;
    store.updateUrgency(id, score, label);
    setQueue([...getFilteredQueue()]);
  };

  const panelTitles = {
    overview: 'Dashboard',
    schedule: "Today's Schedule",
    urgency: 'Urgency Queue',
    history: 'Patient History',
    private: 'Private Slots',
    map: 'Clinic Map',
    notifications: 'Notifications'
  };

  return (
    <div className={styles.dashboardPage}>
      <Sidebar 
        role="doctor" 
        user={user} 
        activePanel={activePanel} 
        onPanelChange={setActivePanel} 
      />
      
      <div className={styles.mainWrap}>
        <div className={styles.topbar}>
          <span className={styles.topbarTitle}>{panelTitles[activePanel]}</span>
          <div className={styles.topbarRight}>
            <div className={styles.searchWrap}>
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input placeholder="Search patients…" />
            </div>
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
              <h2>Good morning, <i>Dr. Mehta.</i></h2>
              <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {appointments.length} appointments today</p>
            </div>
            
            {(() => {
              const currentAppt = store.appointments.find(a => a.status === 'in_progress');
              return currentAppt ? (
                <div style={{ background: 'var(--doc-bg)', border: '1px solid var(--doc-color)', color: 'var(--doc-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
                   <div>
                      <h4 style={{ color: 'var(--doc-color)', margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>Active Consultation — Calling Token: <strong style={{fontSize:'1.1rem'}}>{currentAppt.tokenNumber || '-'}</strong></h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', opacity: 0.85 }}>Patient: <strong>{currentAppt.patientName}</strong> · Slot: {currentAppt.timeSlot} · Symptoms: {currentAppt.symptoms || 'General checkup'}</p>
                   </div>
                   <button className="btn btn-primary btn-sm" style={{ background: 'var(--doc-color)', color: 'white', border: 'none' }} onClick={() => {
                     store.completeConsultation(currentAppt.id);
                     setQueue([...getFilteredQueue()]);
                     setAppointments(store.appointments.map(a => ({
                       ...a,
                       time: a.time || a.timeSlot,
                       urgency: a.urgencyLabel || a.urgency || 'Routine',
                       type: a.type || (a.isPrivate ? 'Private Consultation' : (a.symptoms || 'General Checkup'))
                     })));
                     showToast('Consultation completed.');
                   }}>Complete Visit</button>
                </div>
              ) : (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
                   <div>
                      <h4 style={{ color: 'var(--text-mid)', margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No active consultation</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>Start a consultation from the schedule below to call the next patient.</p>
                   </div>
                   <button className="btn btn-secondary btn-sm" disabled>Complete Visit</button>
                </div>
              );
            })()}
            
            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard} style={{cursor:'pointer'}} onClick={() => setActivePanel('schedule')}>
                <div className={styles.kpiIcon}>
                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div className={styles.kpiLabel}>Today's Patients</div>
                <div className={styles.kpiValue}>{queue.length}</div>
                <div className={styles.kpiDelta}>↑ 2 from yesterday</div>
              </div>
              <div className={styles.kpiCard} style={{cursor:'pointer'}} onClick={() => setActivePanel('urgency')}>
                <div className={styles.kpiIcon} style={{ background: '#fdecea' }}>
                  <svg viewBox="0 0 24 24" stroke="#c0392b"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div className={styles.kpiLabel}>Urgent Cases</div>
                <div className={styles.kpiValue}>{queue.filter(q=>q.urgencyScore>=4).length}</div>
                <div className={styles.kpiDelta} style={{ color: '#c0392b' }}>Requires attention</div>
              </div>
              <div className={styles.kpiCard} style={{cursor:'pointer'}} onClick={() => setActivePanel('private')}>
                <div className={styles.kpiIcon} style={{ background: '#f0eef8' }}>
                  <svg viewBox="0 0 24 24" stroke="#7a72d8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <div className={styles.kpiLabel}>Private Slots</div>
                <div className={styles.kpiValue}>{store.appointments.filter(a=>a.isPrivate&&a.status!=='cancelled').length}</div>
                <div className={styles.kpiDelta} style={{ color: '#7a72d8' }}>Confidential</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className={styles.kpiLabel}>Avg. Wait Time</div>
                <div className={styles.kpiValue}>14<span style={{ fontSize: '1.1rem' }}>m</span></div>
                <div className={styles.kpiDelta}>↓ 3m improved</div>
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.urgencyCard}>
                <div className={styles.urgencyTitle}>Urgency Queue — Today</div>
                {appointments.length === 0 ? (
                  <div style={{ padding: '20px', color: 'var(--gray-500)' }}>No appointments today</div>
                ) : (
                  appointments.slice(0, 4).map((appt, idx) => (
                    <div key={appt.id} className={styles.uqItem}>
                      <div className={styles.uqRank}>{idx + 1}</div>
                      <div className={styles.uqInfo}>
                        <div className={styles.uqName}>{appt.patientName}</div>
                        <div className={styles.uqSym}>{appt.type}</div>
                      </div>
                      <span className={appt.urgency === 'Acute' ? styles.urgAcute : appt.urgency === 'Urgent' ? styles.urgUrgent : styles.urgMedium}>
                        {appt.urgency.toUpperCase()}
                      </span>
                      <div className={styles.uqTime}>{appt.time}</div>
                    </div>
                  ))
                )}
              </div>
              
              <div className={styles.waCard}>
                <div className={styles.waHead}>
                  <div className={styles.waAv}>QT</div>
                  <div>
                    <div className={styles.waNm}>QueueTonic Bot</div>
                    <div className={styles.waSubText}>Clinic notifications</div>
                  </div>
                </div>
                <div className={styles.waMsgs}>
                  <div className={`${styles.waMsg} ${styles.in}`}>Dr. Mehta, Priya Sharma has arrived. Triage: High fever 103°F. Marked ACUTE.<div className={styles.waTime}>8:47 AM</div></div>
                  <div className={`${styles.waMsg} ${styles.in}`}>Reminder: Rohan Gupta at 9:15 AM. Chest pain reported.<div className={styles.waTime}>8:50 AM</div></div>
                  <div className={`${styles.waMsg} ${styles.out}`}>Acknowledged. Move Rohan to 9:00, Priya to 9:20.<div className={styles.waTime}>8:52 AM</div></div>
                </div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <span className={styles.tableCardTitle}>Today's Appointments</span>
              </div>
              <table>
                <thead>
                  <tr><th>Token</th><th>Patient</th><th>Time</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>
                        No appointments today.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td><span className="badge" style={{background:'var(--doc-bg)', color:'var(--doc-color)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{appt.tokenNumber || '-'}</span></td>
                        <td><strong>{appt.patientName}</strong></td>
                        <td>{appt.time}</td>
                        <td>{appt.type}</td>
                        <td>
                          <span className={`${styles.pill} ${appt.status === 'Urgent' || appt.status === 'urgent' ? styles.pillRed : appt.status === 'Confirmed' || appt.status === 'confirmed' ? styles.pillGreen : appt.status === 'in_progress' ? styles.pillBlue : ''}`} style={appt.status === 'Private' ? { background: '#f0eef8', color: '#7a72d8' } : {}}>
                            {appt.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SCHEDULE */}
          <section className={`${styles.panel} ${activePanel === 'schedule' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Today's <i>Schedule</i></h2><p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <span className={styles.tableCardTitle}>Schedule Detail</span>
              </div>
              <table>
                <thead>
                  <tr><th>Token</th><th>Time</th><th>Patient</th><th>Urgency</th><th>Symptoms</th><th>Status</th><th>Consult</th></tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>
                        No patients in the queue today.
                      </td>
                    </tr>
                  ) : (
                    queue.map(q => (
                      <tr key={q.id}>
                        <td><span className="badge" style={{background:'var(--doc-bg)', color:'var(--doc-color)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{q.tokenNumber || '-'}</span></td>
                        <td>{q.timeSlot}</td>
                        <td>
                          <strong 
                            style={{cursor: 'pointer', color: 'var(--doc-color)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '6px'}} 
                            onClick={() => openHistoryDrawer(q.patientName)}
                          >
                            {q.isEmergency && <span className={`${styles.pill} ${styles.pillRed}`} style={{fontSize:'0.65rem', padding:'2px 6px'}}>EMERGENCY</span>}
                            {q.isWalkIn && !q.isEmergency && <span className={styles.pill} style={{background:'#fef3c7', color:'#d97706', fontSize:'0.65rem', padding:'2px 6px'}}>WALK-IN</span>}
                            {q.patientName} {q.age ? `(${q.age})` : ''}
                          </strong>
                        </td>
                        <td>
                          <select 
                            value={q.urgencyLabel} 
                            onChange={(e) => handleUpdateUrgency(q.id, e.target.value)}
                            className={q.urgencyScore >= 4 ? styles.pillRed : q.urgencyScore >= 3 ? styles.pillBlue : styles.pillGreen}
                            style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '8px', fontWeight: 'bold' }}
                          >
                            <option value="Routine" style={{ color: 'initial' }}>Routine</option>
                            <option value="Medium" style={{ color: 'initial' }}>Medium</option>
                            <option value="Urgent" style={{ color: 'initial' }}>Urgent</option>
                            <option value="Acute" style={{ color: 'initial' }}>Acute</option>
                          </select>
                        </td>
                        <td>{q.isPrivate ? <i style={{color:'purple'}}>Private Consultation</i> : q.symptoms}</td>
                        <td>
                          <span className={q.status === 'confirmed' ? styles.pillGreen : styles.pill}>
                            {q.status}
                          </span>
                        </td>
                        <td>
                          {q.status === 'cancelled' ? (
                            <span style={{color:'var(--gray-500)'}}>Cancelled</span>
                          ) : q.status === 'rescheduled' ? (
                            <span style={{color:'var(--gray-500)'}}>Rescheduled to {q.timeSlot}</span>
                          ) : (
                            <div style={{display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center'}}>
                              <button className="btn btn-primary btn-xs" onClick={() => handleStartConsultation(q.id, q.patientName)}>Start Consult</button>
                              <button className="btn btn-secondary btn-xs" style={{color:'red'}} onClick={() => handleCancel(q.id)}>Cancel</button>
                              
                              {reschedulingId === q.id ? (
                                <div style={{display:'flex', gap:'5px'}}>
                                  <select 
                                    value={newSlot} 
                                    onChange={(e) => setNewSlot(e.target.value)}
                                    className="btn btn-xs"
                                  >
                                    <option value="" disabled>Select</option>
                                    {['9:00 AM', '9:15 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map(slot => (
                                      <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                  </select>
                                  <button className="btn btn-primary btn-xs" onClick={() => handleReschedule(q.id)} disabled={!newSlot}>Confirm</button>
                                  <button className="btn btn-secondary btn-xs" onClick={() => setReschedulingId(null)}>X</button>
                                </div>
                              ) : (
                                <button className="btn btn-secondary btn-xs" onClick={() => setReschedulingId(q.id)}>Reschedule</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* URGENCY */}
          <section className={`${styles.panel} ${activePanel === 'urgency' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Urgency <i>Triage Engine</i></h2><p>AI-sorted by symptom severity · Auto-updates on new bookings</p></div>
            <div className={styles.urgencyCard}>
              <div className={styles.urgencyTitle}>Live Queue — Sorted by Urgency</div>
              {store.getQueue().filter(a => a.urgencyScore >= 4 && a.status !== 'cancelled' && a.status !== 'in_progress').length === 0 ? (
                <div style={{ padding: '20px', color: 'var(--gray-500)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>No urgent cases today</div>
              ) : store.getQueue().filter(a => a.urgencyScore >= 4 && a.status !== 'cancelled' && a.status !== 'in_progress').map((appt, idx) => (
                <div key={appt.id} className={styles.uqItem} style={{ flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div className={styles.uqRank}>{idx + 1}</div>
                      <div className={styles.uqInfo}>
                        <div className={styles.uqName}>{appt.patientName} {appt.age ? `(${appt.age})` : ''}</div>
                        <div className={styles.uqSym}>{appt.symptoms || appt.type}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <span className={appt.urgencyScore >= 5 ? styles.urgAcute : styles.urgUrgent}>
                         {appt.urgencyLabel.toUpperCase()}
                       </span>
                       <div className={styles.uqTime}>{appt.timeSlot}</div>
                       <button className="btn btn-secondary btn-xs" onClick={() => openHistoryDrawer(appt.patientName)}>See History</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* HISTORY */}
          <section className={`${styles.panel} ${activePanel === 'history' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Patient <i>History</i></h2><p>Full longitudinal records — doctor access only</p></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Array.from(new Set(store.appointments.filter(a => a.status !== 'cancelled').map(a => a.patientName))).map(name => {
                const appt = store.appointments.find(a => a.patientName === name && a.status !== 'cancelled');
                const isExpanded = selectedPatientName === name && !historyDrawerOpen;
                return (
                  <div key={name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div 
                      style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'var(--surface2)' : 'transparent' }} 
                      onClick={() => {
                        if (isExpanded) { setSelectedPatientName(''); setSelectedPatientHistory([]); }
                        else { setSelectedPatientName(name); setSelectedPatientHistory(store.getPatientHistory(name)); setHistoryDrawerOpen(false); }
                      }}
                    >
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: 'var(--text)' }}>{name}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)' }}>{appt.timeSlot}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                         <span className={appt.urgencyScore >= 4 ? styles.pillRed : appt.urgencyScore >= 3 ? styles.pillBlue : styles.pillGreen}>{appt.urgencyLabel}</span>
                         <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px 20px' }}>
                        {selectedPatientHistory.length === 0 ? <p style={{ color: 'var(--gray-500)', margin: '10px 0 0 0' }}>No history found.</p> : selectedPatientHistory.map(entry => (
                          <div key={entry.id} style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', color: 'var(--text)' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--doc-color)' }}>{entry.date} - {entry.doctor}</div>
                            <div style={{ marginBottom: '6px' }}><strong>Diagnosis:</strong> {entry.diagnosis}</div>
                            <div style={{ marginBottom: '6px' }}><strong>Prescription:</strong> {entry.prescription}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}><strong>Notes:</strong> {entry.notes}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* PRIVATE */}
          <section className={`${styles.panel} ${activePanel === 'private' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Private <i>Slots</i></h2><p>Visible only to you — receptionists see "Unavailable"</p></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {store.appointments.filter(a => a.isPrivate && a.status !== 'cancelled' && a.status !== 'in_progress').map(a => (
                <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--text)' }}>{a.patientName}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)' }}>{a.timeSlot} · Token: {a.tokenNumber || '-'} · Private Consultation</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={styles.pill} style={{ background: '#f0eef8', color: '#7a72d8', padding: '6px 12px' }}>{a.status}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleStartConsultation(a.id, a.patientName)}>Start</button>
                  </div>
                </div>
              ))}
              {store.appointments.filter(a => a.isPrivate && a.status !== 'cancelled' && a.status !== 'in_progress').length === 0 && (
                <div style={{ padding: '20px', color: 'var(--gray-500)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>No private consultations found.</div>
              )}
            </div>
          </section>

          {/* MAP */}
          <section className={`${styles.panel} ${activePanel === 'map' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Clinic <i>Map</i></h2><p>Live room status · Predictive wait times</p></div>
            <div className={styles.mapCard}>
              <div className={styles.mapTitle}>Floor Plan <span className={styles.liveBadge}><span className={styles.liveDot}></span>Live</span></div>
              <div className={styles.roomGrid}>
                <div className={`${styles.room} ${styles.occ}`}><div className={styles.roomNum}>01</div><div className={styles.roomStatus}>Occupied</div><div className={styles.roomTime}>~18 min</div></div>
                <div className={`${styles.room} ${styles.avail}`}><div className={styles.roomNum}>02</div><div className={styles.roomStatus}>Available</div><div className={styles.roomTime}>Ready</div></div>
                <div className={`${styles.room} ${styles.priv}`}><div className={styles.roomNum}>03</div><div className={styles.roomStatus}>Private</div><div className={styles.roomTime}>12:00 PM</div></div>
                <div className={`${styles.room} ${styles.avail}`}><div className={styles.roomNum}>04</div><div className={styles.roomStatus}>Available</div><div className={styles.roomTime}>Ready</div></div>
                <div className={`${styles.room} ${styles.occ}`}><div className={styles.roomNum}>05</div><div className={styles.roomStatus}>Occupied</div><div className={styles.roomTime}>~5 min</div></div>
                <div className={`${styles.room} ${styles.avail}`}><div className={styles.roomNum}>06</div><div className={styles.roomStatus}>Available</div><div className={styles.roomTime}>Ready</div></div>
                <div className={`${styles.room} ${styles.avail}`}><div className={styles.roomNum}>Lab</div><div className={styles.roomStatus}>Available</div><div className={styles.roomTime}>Walk-in</div></div>
                <div className={`${styles.room} ${styles.occ}`}><div className={styles.roomNum}>Rx</div><div className={styles.roomStatus}>Occupied</div><div className={styles.roomTime}>~2 min</div></div>
              </div>
              <div className={styles.mapLegend}>
                <div className={styles.mlItem}><div className={styles.mlDot} style={{ background: '#c0392b' }}></div>Occupied</div>
                <div className={styles.mlItem}><div className={styles.mlDot} style={{ background: 'var(--doc-color)' }}></div>Available</div>
                <div className={styles.mlItem}><div className={styles.mlDot} style={{ background: '#7a72d8' }}></div>Private</div>
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
                <div key={notif.id} className={styles.notifItem} style={{ borderLeft: notif.type === 'emergency' ? '4px solid #c0392b' : 'none' }}>
                  <div className={styles.notifIcon} style={{ background: notif.type === 'emergency' ? '#fdecea' : notif.type === 'smartgap' ? 'var(--doc-bg)' : 'var(--surface2)' }}>
                    {notif.type === 'emergency' ? (
                      <svg viewBox="0 0 24 24" stroke="#c0392b" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    ) : (
                       <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                    )}
                  </div>
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
      
      {/* HISTORY DRAWER */}
      {historyDrawerOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', zIndex: 1000, padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text)' }}>{selectedPatientName}'s History</h2>
            <button className="btn btn-secondary btn-xs" onClick={() => setHistoryDrawerOpen(false)}>Close</button>
          </div>
          {selectedPatientHistory.length === 0 ? (
            <p style={{ color: 'var(--gray-500)' }}>No history found for this patient.</p>
          ) : (
            selectedPatientHistory.map(entry => (
              <div key={entry.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px', background: 'var(--surface2)', color: 'var(--text)' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--doc-color)' }}>{entry.date} - {entry.doctor}</div>
                <div style={{ marginBottom: '6px' }}><strong>Diagnosis:</strong> {entry.diagnosis}</div>
                <div style={{ marginBottom: '6px' }}><strong>Prescription:</strong> {entry.prescription}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}><strong>Notes:</strong> {entry.notes}</div>
              </div>
            ))
          )}
        </div>
      )}
      
      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  );
};

export default DoctorDashboard;
