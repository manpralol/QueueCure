import React, { useState, useEffect } from 'react';
import styles from './ReceptionistDashboard.module.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import { notificationService } from '../../services/notificationService';
import { appointmentService } from '../../services/appointmentService';
import { store } from '../../store/demoStore';
import { Toast } from '../../components/Toast/Toast';
import socket from '../../services/socketService';

const ReceptionistDashboard = ({ user, onLogout }) => {
  const [activePanel, setActivePanel] = useState('overview');
  const [queue, setQueue] = useState(() => store.getQueue());
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

  // Socket.io connection for real-time queue synchronization & initial sync on mount
  useEffect(() => {
    const syncInitialAppointments = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const doctorId = 1; // Demo doctor ID
        const backendAppts = await appointmentService.getAppointments(today, doctorId);
        
        // Map backend appointments to store format
        const mappedAppts = backendAppts.map(a => ({
          id: a.id,
          patientName: a.patientName,
          patientId: a.patientId || 3,
          doctorId: a.doctorId || 1,
          doctorName: a.doctorName || 'Dr. Arjun Mehta',
          date: today,
          timeSlot: a.time || a.timeSlot,
          symptoms: a.symptoms || '',
          urgencyScore: a.urgencyScore || 1,
          urgencyLabel: a.urgencyLabel || 'Routine',
          isPrivate: a.isPrivate || false,
          status: a.status
        }));
        
        // Merge keeping local data as the source of truth for existing records
        const localById = Object.fromEntries(store.appointments.map(a => [a.id, a]));
        const finalMerge = [
          ...store.appointments, // keep all local entries as-is
          ...mappedAppts.filter(a => !localById[a.id]) // only add truly new ones from backend
        ];
        store.appointments = finalMerge;
        store.save();
        setQueue(store.getQueue());
      } catch (err) {
        console.error('Failed to sync appointments from backend:', err);
      }
    };

    // Initial sync
    syncInitialAppointments();

    const handleNewAppointment = (appt) => {
      console.log('[Socket] Received appointment:new:', appt);
      const exists = store.appointments.some(a => a.id === appt.id);
      if (!exists) {
        store.appointments.push(appt);
        store.save();
        setQueue(store.getQueue());
        showToast(`New Booking: ${appt.patientName} for ${appt.timeSlot}`);
      }
    };

    const handleUpdatedAppointment = (appt) => {
      console.log('[Socket] Received appointment:updated:', appt);
      const idx = store.appointments.findIndex(a => a.id === appt.id);
      if (idx !== -1) {
        store.appointments[idx] = appt;
      } else {
        store.appointments.push(appt);
      }
      store.save();
      setQueue(store.getQueue());
      showToast(`Appointment Updated: ${appt.patientName} (${appt.status})`);
    };

    socket.on('appointment:new', handleNewAppointment);
    socket.on('appointment:updated', handleUpdatedAppointment);

    return () => {
      socket.off('appointment:new', handleNewAppointment);
      socket.off('appointment:updated', handleUpdatedAppointment);
    };
  }, []);

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
    if (activePanel === 'queue' || activePanel === 'overview') {
      setQueue([...store.getQueue()]);
    } else if (activePanel === 'notifications') {
      const recNotifs = store.notifications.filter(n => n.userId === 'receptionist');
      setNotifications([...recNotifs].reverse());
      store.markNotificationsRead('receptionist');
    }
  }, [activePanel]);

  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkData, setWalkData] = useState({ name: '', age: '', symptoms: '', urgency: 'Routine', slot: '9:00 AM', pos: 1 });

  const handleWalkIn = () => {
    const scores = { 'Routine': 1, 'Medium': 3, 'Urgent': 4, 'Acute': 5 };
    store.addWalkIn(walkData.name, walkData.symptoms, scores[walkData.urgency], walkData.urgency, walkData.slot, Number(walkData.pos), Number(walkData.age) || null);
    setQueue([...store.getQueue()]);
    setShowWalkInForm(false);
    setWalkData({ name: '', age: '', symptoms: '', urgency: 'Routine', slot: '9:00 AM', pos: 1 });
    showToast('Walk-in added to queue.');
  };

  // WhatsApp store
  const [waMsgs, setWaMsgs] = useState([
    { in: true, text: "Hi! I'd like to book with Dr. Mehta.", time: "8:12 AM" },
    { in: false, text: "Hello! What are your symptoms?", time: "8:12 AM" },
    { in: true, text: "Fever and chills since last night.", time: "8:13 AM" },
    { in: false, text: "Urgency: ACUTE. Booking you for 9:00 AM today. Confirm?", time: "8:13 AM" },
    { in: true, text: "Yes please!", time: "8:14 AM" },
    { in: false, text: "✓ Booked. 9:00 AM, Dr. Mehta, Room 01. Reminder at 8:45 AM.", time: "8:14 AM" }
  ]);
  const [waInput, setWaInput] = useState('');

  const sendWaMsg = () => {
    if(!waInput.trim()) return;
    setWaMsgs([...waMsgs, { in: false, text: waInput, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setWaInput('');
  };

  // Emergency Audit
  const [emerName, setEmerName] = useState('');
  const [emerReason, setEmerReason] = useState('Cardiac Emergency');
  const [emerLog, setEmerLog] = useState([
    { time: 'Yesterday 11:32 AM', by: 'Sneha Patil', reason: 'Cardiac emergency', affected: '4 patients' },
    { time: '2 days ago 3:10 PM', by: 'Sneha Patil', reason: 'Severe allergy', affected: '2 patients' }
  ]);
  
  const handleEmergency = () => {
    if (!emerName.trim()) return;
    store.addEmergency(emerName, emerReason, 0);
    setEmerLog([{ time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), by: 'Sneha Patil', reason: emerReason, affected: 'All patients' }, ...emerLog]);
    showToast('Emergency slot inserted. Doctor notified.');
    setEmerName('');
    setEmerReason('Cardiac Emergency');
    setQueue([...store.getQueue()]);
  };

  const handleApprove = async (id) => {
    store.approveAppointment(id);
    setQueue([...store.getQueue()]);
    try {
      await appointmentService.updateStatus(id, 'confirmed');
    } catch (err) {
      console.warn('Failed to approve appointment on backend:', err);
    }
  };

  const handleCancel = async (id) => {
    store.cancelAppointment(id);
    setQueue([...store.getQueue()]);
    try {
      await appointmentService.updateStatus(id, 'cancelled');
    } catch (err) {
      console.warn('Failed to cancel appointment on backend:', err);
    }
  };

  const handleReschedule = async (id) => {
    const slotToReschedule = newSlot;
    store.rescheduleAppointment(id, slotToReschedule);
    setReschedulingId(null);
    setNewSlot('');
    setQueue([...store.getQueue()]);
    try {
      await appointmentService.rescheduleAppointment(id, slotToReschedule);
    } catch (err) {
      console.warn('Failed to reschedule appointment on backend:', err);
    }
  };

  const handleRemove = (id) => {
    store.removeFromQueue(id);
    setQueue([...store.getQueue()]);
    showToast('Patient removed from queue.');
  };

  const panelTitles = {
    overview: 'Clinic Status',
    queue: 'Patient Queue',
    smartgap: 'Smart Gap Fill',
    reschedule: 'One-Tap Reschedule',
    whatsapp: 'WhatsApp Bot',
    emergency: 'Emergency Override',
    map: 'Clinic Map',
    notifications: 'Notifications'
  };

  // Derive dynamic stats from queue and store:
  const activeQueue = queue.filter(a => a.status !== 'cancelled' && a.status !== 'completed');
  const queueLength = activeQueue.length;
  const smartGaps = store.smartGapActive ? 1 : 0;
  const totalBookings = store.appointments.length;
  
  // Occupancy rate calculation (based on active queue vs capacity of 10)
  const capacity = 10;
  const occupancyPercentage = Math.min(Math.round((queue.filter(a => a.status !== 'cancelled').length / capacity) * 100), 100);

  // Bot tasks calculation (derived count of walk-ins + confirmed appointments)
  const botTasksCount = queue.filter(a => a.isWalkIn).length + 3;

  return (
    <div className={styles.dashboardPage}>
      <Sidebar
        role="receptionist"
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
              <input placeholder="Search patients or slots…" />
            </div>
            <button className={styles.notifBtn}>
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /></svg>
              <div className={styles.notifDot}></div>
            </button>
            <button className="theme-btn" style={{ marginLeft: '10px' }} onClick={() => document.querySelector('.theme-btn')?.click()}>
              <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            </button>
          </div>
        </div>

        <div className={styles.contentArea}>
          {/* OVERVIEW */}
          <section className={`${styles.panel} ${activePanel === 'overview' ? styles.active : ''}`}>
            <div className={styles.greeting}>
              <h2>Welcome back, <i>{user?.name || 'Sneha'}.</i></h2>
              <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Clinic is currently {occupancyPercentage}% booked</p>
            </div>

            <div className={styles.kpiGrid}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                  <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                </div>
                <div className={styles.kpiLabel}>Queue Length</div>
                <div className={styles.kpiValue}>{queueLength}</div>
                <div className={styles.kpiDelta}>Avg. wait 12m</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ background: 'var(--doc-bg)' }}>
                  <svg viewBox="0 0 24 24" stroke="var(--doc-color)"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                </div>
                <div className={styles.kpiLabel}>Smart Gaps</div>
                <div className={styles.kpiValue}>{smartGaps}</div>
                <div className={styles.kpiDelta} style={{ color: 'var(--doc-color)' }}>Slot filled via Bot</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                </div>
                <div className={styles.kpiLabel}>Bookings</div>
                <div className={styles.kpiValue}>{totalBookings}</div>
                <div className={styles.kpiDelta}>Today's total</div>
              </div>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon}>
                  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                </div>
                <div className={styles.kpiLabel}>Bot Tasks</div>
                <div className={styles.kpiValue}>{botTasksCount}</div>
                <div className={styles.kpiDelta}>Automated replies</div>
              </div>
            </div>

            {store.smartGapActive && (
              <div className={styles.sgBanner}>
                <div className={styles.sgInfo}>
                  <h4>Smart Gap Alert — {store.smartGapSlot} Slot Available</h4>
                  <p>Dr. Arjun Mehta's slot was cancelled. Waitlist search found {store.smartGapPatient} as the best candidate.</p>
                </div>
                <button className={styles.sgBtn} onClick={() => {
                  store.confirmSmartGap();
                  showToast(`WhatsApp sent to ${store.smartGapPatient}. Slot offered.`);
                  setQueue([...store.getQueue()]);
                }}>Confirm WhatsApp Send</button>
              </div>
            )}

            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <span className={styles.tableCardTitle}>Current Queue</span>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowWalkInForm(!showWalkInForm)}>+ Add Walk-In</button>
              </div>
              
              {showWalkInForm && (
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div><label style={{fontSize:'0.75rem',display:'block'}}>Name</label><input type="text" value={walkData.name} onChange={e=>setWalkData({...walkData,name:e.target.value})} style={{padding:'6px',border:'1px solid var(--border)',borderRadius:'4px'}}/></div>
                  <div><label style={{fontSize:'0.75rem',display:'block'}}>Age</label><input type="number" value={walkData.age} onChange={e=>setWalkData({...walkData,age:e.target.value})} style={{padding:'6px',border:'1px solid var(--border)',borderRadius:'4px', width:'60px'}}/></div>
                  <div><label style={{fontSize:'0.75rem',display:'block'}}>Symptoms</label><input type="text" value={walkData.symptoms} onChange={e=>setWalkData({...walkData,symptoms:e.target.value})} style={{padding:'6px',border:'1px solid var(--border)',borderRadius:'4px'}}/></div>
                  <div><label style={{fontSize:'0.75rem',display:'block'}}>Urgency</label><select value={walkData.urgency} onChange={e=>setWalkData({...walkData,urgency:e.target.value})} style={{padding:'6px',border:'1px solid var(--border)',borderRadius:'4px'}}><option>Routine</option><option>Medium</option><option>Urgent</option><option>Acute</option></select></div>
                  <div><label style={{fontSize:'0.75rem',display:'block'}}>Slot</label><select value={walkData.slot} onChange={e=>setWalkData({...walkData,slot:e.target.value})} style={{padding:'6px',border:'1px solid var(--border)',borderRadius:'4px'}}><option>9:00 AM</option><option>9:15 AM</option><option>10:00 AM</option><option>11:00 AM</option><option>2:00 PM</option><option>3:00 PM</option><option>4:00 PM</option></select></div>
                  <div><label style={{fontSize:'0.75rem',display:'block'}}>Pos</label><input type="number" value={walkData.pos} onChange={e=>setWalkData({...walkData,pos:e.target.value})} style={{padding:'6px',border:'1px solid var(--border)',borderRadius:'4px', width:'50px'}}/></div>
                  <button className="btn btn-primary btn-sm" onClick={handleWalkIn} disabled={!walkData.name}>Submit</button>
                </div>
              )}
              <table>
                <thead>
                  <tr><th>Token</th><th>Patient</th><th>Check-In</th><th>Slot</th><th>Doctor</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>
                        No patients in the queue today.
                      </td>
                    </tr>
                  ) : (
                    queue.map((appt) => (
                      <tr key={appt.id}>
                        <td><span className="badge" style={{background:'var(--rec-bg)', color:'var(--rec-color)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{appt.tokenNumber || 'Pending'}</span></td>
                        <td><strong>{appt.patientName}</strong></td>
                        <td>{appt.checkInTime || '9:12 AM'}</td>
                        <td>{appt.timeSlot}</td>
                        <td>{appt.doctorName}</td>
                        <td>
                          <span className={`${styles.pill} ${appt.status === 'Urgent' ? styles.pillRed : appt.status === 'Confirmed' || appt.status === 'confirmed' ? styles.pillGreen : styles.pillBlue}`}>
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* QUEUE */}
          <section className={`${styles.panel} ${activePanel === 'queue' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Live Patient <i>Queue</i></h2><p>Real-time check-ins and room assignments</p></div>
            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}><span className={styles.tableCardTitle}>All Doctors</span></div>
              <table>
                <thead>
                  <tr><th>Token</th><th>Patient</th><th>Target Doctor</th><th>Time</th><th>Urgency</th><th>Status</th><th>Action</th></tr>
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
                        <td><span className="badge" style={{background:'var(--rec-bg)', color:'var(--rec-color)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{q.tokenNumber || '-'}</span></td>
                        <td><strong>{q.patientName}</strong> {q.age ? `(${q.age})` : ''}</td>
                        <td>{q.doctorName}</td>
                        <td>{q.timeSlot}</td>
                        <td>
                          <span className={q.urgencyScore >= 4 ? styles.pillRed : q.urgencyScore >= 3 ? styles.pillBlue : styles.pillGreen}>
                            {q.urgencyLabel}
                          </span>
                        </td>
                        <td>
                          <span className={q.status === 'confirmed' ? styles.pillGreen : q.status === 'cancellation_requested' || q.status === 'cancelled' || q.status === 'emergency' ? styles.pillRed : styles.pill}>
                            {q.status === 'cancellation_requested' ? 'Cancel Req.' : q.status}
                          </span>
                        </td>
                        <td>
                          {q.status === 'cancelled' || q.status === 'completed' ? (
                            <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                              <span className={styles.pill} style={{background:'var(--surface2)', color:'var(--gray-500)', textTransform:'capitalize'}}>{q.status}</span>
                              <button className="btn btn-secondary btn-xs" style={{color:'red', fontWeight:'bold', border:'none', background:'transparent', fontSize:'1.1rem', cursor:'pointer', padding:'2px 6px'}} onClick={() => handleRemove(q.id)} title="Remove from queue">✕</button>
                            </div>
                          ) : q.status === 'rescheduled' ? (
                            <span className={styles.pill} style={{background:'var(--surface2)', color:'var(--gray-500)'}}>Rescheduled to {q.timeSlot}</span>
                          ) : (
                            <div style={{display:'flex', gap:'5px', flexWrap:'wrap', alignItems:'center'}}>
                              {q.status === 'cancellation_requested' ? (
                                <>
                                  <button className="btn btn-primary btn-xs" style={{background: 'var(--red)', borderColor: 'var(--red)'}} onClick={() => handleCancel(q.id)}>Approve Cancel</button>
                                  <button className="btn btn-secondary btn-xs" onClick={() => { q.status = 'confirmed'; store.save(); setQueue([...store.getQueue()]); }}>Deny Cancel</button>
                                </>
                              ) : q.status === 'pending' ? (
                                <button className="btn btn-primary btn-xs" onClick={() => handleApprove(q.id)}>Approve</button>
                              ) : null}
                              
                              {q.status !== 'cancellation_requested' && (
                                 <button className="btn btn-secondary btn-xs" style={{color:'red'}} onClick={() => handleCancel(q.id)}>Cancel</button>
                              )}

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

          {/* SMART GAP */}
          <section className={`${styles.panel} ${activePanel === 'smartgap' ? styles.active : ''}`}>
             <div className={styles.greeting}><h2>Smart Gap <i>Automation</i></h2><p>Auto-filling cancellations via WhatsApp/SMS integration</p></div>
             
             {store.smartGapActive && (
               <div className={styles.sgBanner}>
                 <div className={styles.sgInfo}>
                   <h4>Cancellation Found: {store.smartGapSlot} — Dr. Arjun Mehta</h4>
                   <p>QueueTonic identified {store.smartGapPatient} as the best candidate for this slot.</p>
                 </div>
                 <button className={styles.sgBtn} onClick={() => {
                   store.confirmSmartGap();
                   showToast(`WhatsApp sent to ${store.smartGapPatient}. Slot offered.`);
                   setQueue([...store.getQueue()]);
                 }}>Approve &amp; Notify</button>
               </div>
             )}

             {store.smartGapActive && (
               <div className={styles.tableCard}>
                 <div className={styles.tableCardHead}><span className={styles.tableCardTitle}>Waitlist — Auto-Offer Queue</span></div>
                 <table><thead><tr><th>Position</th><th>Patient</th><th>Contact</th><th>Notified</th><th>Response</th></tr></thead>
                   <tbody>
                     <tr><td>#1</td><td>{store.smartGapPatient}</td><td>+91 98xxx xxxx</td><td><span className={`${styles.pill} ${styles.pillGreen}`}>WA Ready</span></td><td><span className={styles.pill} style={{ background: '#fef3c7', color: '#92400e' }}>Awaiting Action</span></td></tr>
                     <tr><td>#2</td><td>Ananya Desai</td><td>+91 87xxx xxxx</td><td><span className={styles.pill} style={{ background: '#f3f4f6', color: '#6b7280' }}>Not yet</span></td><td>—</td></tr>
                   </tbody></table>
               </div>
             )}
             
             {!store.smartGapActive && (
               <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                 No smart gaps currently active.
               </div>
             )}
          </section>

          {/* RESCHEDULE */}
          <section className={`${styles.panel} ${activePanel === 'reschedule' ? styles.active : ''}`}>
            <div className={styles.greeting}>
              <h2>One-Tap <i>Reschedule</i></h2>
              <p>Cascade all patients when a consultation runs long</p>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '18px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', marginBottom: '12px', color: 'var(--text)' }}>Current Overrun Alert</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-mid)', marginBottom: '18px', lineHeight: '1.65' }}>
                {queue.filter(a => a.status === 'confirmed' || a.status === 'rescheduled')[0]?.patientName || 'No patient'}'s consultation has run 12 minutes over. {Math.max(0, queue.filter(a => a.status === 'confirmed' || a.status === 'rescheduled').length - 1)} patients affected. Cascade reschedule all by +15 min?
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => showToast('Patients rescheduled and notified via WhatsApp!')}>Cascade +15 min (Notify All)</button>
                <button className="btn btn-secondary btn-sm">Custom Delay</button>
                <button className="btn btn-secondary btn-sm">Skip Patient</button>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <span className={styles.tableCardTitle}>Affected Patients</span>
              </div>
              <table>
                <thead>
                  <tr><th>Patient</th><th>Original</th><th>New Slot</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {queue.filter(a => a.status === 'confirmed' || a.status === 'rescheduled').slice(1).map((appt) => (
                    <tr key={appt.id}>
                      <td>{appt.patientName}</td>
                      <td>{appt.timeSlot}</td>
                      <td>{appt.timeSlot} (+15m)</td>
                      <td><span className={styles.pill} style={{ background: '#fef3c7', color: '#92400e' }}>Pending</span></td>
                    </tr>
                  ))}
                  {queue.filter(a => a.status === 'confirmed' || a.status === 'rescheduled').slice(1).length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>
                        No subsequent patients affected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* WHATSAPP BOT */}
          <section className={`${styles.panel} ${activePanel === 'whatsapp' ? styles.active : ''}`}>
            <div className={styles.greeting}>
              <h2>WhatsApp <i>Bot</i></h2>
              <p>Conversational booking, reminders &amp; notifications</p>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.waCard}>
                <div className={styles.waHead}>
                  <div className={styles.waAv}>QT</div>
                  <div>
                    <div className={styles.waNm}>QueueTonic Bot</div>
                    <div className={styles.waSubText}>Patient: {queue[0]?.patientName || 'No active patient'}</div>
                  </div>
                </div>
                <div className={styles.waMsgs}>
                  {waMsgs.map((msg, i) => (
                    <div key={i} className={`${styles.waMsg} ${msg.in ? styles.in : styles.out}`}>
                      {msg.text}<div className={styles.waTime}>{msg.time}</div>
                    </div>
                  ))}
                </div>
                <div className={styles.waInputRow}>
                  <input 
                    placeholder="Type manual message…" 
                    value={waInput} 
                    onChange={e => setWaInput(e.target.value)} 
                    onKeyDown={e => { if(e.key === 'Enter') sendWaMsg() }}
                  />
                  <button className={styles.waSendBtn} onClick={sendWaMsg}>Send</button>
                </div>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.tableCardHead}>
                  <span className={styles.tableCardTitle}>Bot Activity Today</span>
                </div>
                <table>
                  <thead>
                    <tr><th>Action</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Bookings via bot</td><td>{queue.filter(a => a.isWalkIn).length + 3}</td></tr>
                    <tr><td>Reminders sent</td><td>{queue.filter(a => a.status === 'confirmed').length * 2 + 2}</td></tr>
                    <tr><td>Cancellations processed</td><td>{queue.filter(a => a.status === 'cancelled').length + 1}</td></tr>
                    <tr><td>Smart Gap offers</td><td>{store.smartGapActive ? 1 : 2}</td></tr>
                    <tr><td>Reschedule confirmations</td><td>{queue.filter(a => a.status === 'rescheduled').length}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* EMERGENCY OVERRIDE */}
          <section className={`${styles.panel} ${activePanel === 'emergency' ? styles.active : ''}`}>
            <div className={styles.greeting}>
              <h2>Emergency <i>Override</i></h2>
              <p>Insert urgent walk-in ahead of queue — full audit trail</p>
            </div>

            <div className={styles.emergencyCard}>
              <div className={styles.emergencyTitle}>⚠ Emergency Override Mode</div>
              <div className={styles.emergencyText}>
                Use only for critical walk-in emergencies. This action is logged and requires a reason code.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-light)', display: 'block', marginBottom: '6px' }}>Patient Name</label>
                  <input type="text" value={emerName} onChange={e=>setEmerName(e.target.value)} placeholder="Walk-in name" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-light)', display: 'block', marginBottom: '6px' }}>Reason / Urgency Code</label>
                  <select value={emerReason} onChange={e=>setEmerReason(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none' }}>
                    <option>Cardiac Emergency</option>
                    <option>Severe Trauma</option>
                    <option>Acute Respiratory Distress</option>
                    <option>Other Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-sm" style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }} onClick={handleEmergency} disabled={!emerName}>
                  Insert Emergency Slot
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEmerName(''); setEmerReason('Cardiac Emergency'); }}>Cancel</button>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableCardHead}>
                <span className={styles.tableCardTitle}>Audit Log — Previous Overrides</span>
              </div>
              <table>
                <thead>
                  <tr><th>Time</th><th>By</th><th>Reason</th><th>Affected</th></tr>
                </thead>
                <tbody>
                  {emerLog.map((log, i) => (
                    <tr key={i}><td>{log.time}</td><td>{log.by}</td><td>{log.reason}</td><td>{log.affected}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* MAP */}
          <section className={`${styles.panel} ${activePanel === 'map' ? styles.active : ''}`}>
            <div className={styles.greeting}><h2>Global <i>Clinic Map</i></h2><p>View all room statuses and patient locations</p></div>
            <div className={styles.mapCard}>
              <div className={styles.mapTitle}>Floor Plan Status</div>
              <div className={styles.roomGrid}>
                <div className={`${styles.room} ${styles.occ}`}><div className={styles.roomNum}>01</div><div className={styles.roomStatus}>Occupied [Dr. M]</div></div>
                <div className={`${styles.room} ${styles.avail}`}><div className={styles.roomNum}>02</div><div className={styles.roomStatus}>Available</div></div>
                <div className={`${styles.room} ${styles.occ}`}><div className={styles.roomNum}>03</div><div className={styles.roomStatus}>Private [Dr. K]</div></div>
                <div className={`${styles.room} ${styles.avail}`}><div className={styles.roomNum}>04</div><div className={styles.roomStatus}>Available</div></div>
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
                  <div className={styles.notifIcon} style={{ background: 'var(--rec-bg)' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--rec-color)" strokeWidth="1.8" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /></svg>
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
      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  );
};

export default ReceptionistDashboard;
