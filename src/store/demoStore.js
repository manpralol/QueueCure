let saved = localStorage.getItem('qt-appointments')
let version = localStorage.getItem('qt-version')
let parsed = []

if (!version || version < '2') {
  console.warn('[Store Migration] Seeding new data for version 2');
  localStorage.removeItem('qt-appointments')
  localStorage.setItem('qt-version', '2')
  
  parsed = [
    { id: Date.now(), patientName: 'Aarav Patel', patientId: 4, doctorId: 1, doctorName: 'Dr. Arjun Mehta', date: new Date().toISOString().split('T')[0], timeSlot: '10:00 AM', symptoms: 'Fever and cough', urgencyScore: 3, urgencyLabel: 'Medium', isPrivate: false, status: 'confirmed', checkInTime: '9:45 AM', tokenNumber: 'T-001' },
    { id: Date.now() + 1, patientName: 'Nisha Gupta', patientId: 5, doctorId: 1, doctorName: 'Dr. Arjun Mehta', date: new Date().toISOString().split('T')[0], timeSlot: '10:30 AM', symptoms: 'Regular checkup', urgencyScore: 1, urgencyLabel: 'Routine', isPrivate: false, status: 'confirmed', checkInTime: '10:15 AM', tokenNumber: 'T-002' }
  ]
  localStorage.setItem('qt-appointments', JSON.stringify(parsed))
} else if (saved) {
  try {
    parsed = JSON.parse(saved)
  } catch (err) {
    console.error('Failed to parse localStorage appointments', err)
  }
}

export const store = {
  appointments: parsed,

  notifications: [],
  getNextTokenNumber(prefix = 'T') {
    let max = 0;
    this.appointments.forEach(a => {
      if (a.tokenNumber) {
        const match = a.tokenNumber.match(/\d+/);
        if (match) {
          const val = parseInt(match[0], 10);
          if (val > max) max = val;
        }
      }
    });
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  },
  smartGapActive: true,
  smartGapSlot: '3:00 PM',
  smartGapPatient: 'Ravi Kumar',

  patientHistory: {
    'Rohan Gupta': [
      { id: 1, date: '2026-02-20', doctor: 'Dr. Arjun Mehta', diagnosis: 'Chest pain investigation', prescription: 'ECG ordered, aspirin 75mg', notes: 'Referred to cardiology' },
      { id: 2, date: '2026-01-08', doctor: 'Dr. Arjun Mehta', diagnosis: 'Stress-induced anxiety', prescription: 'Alprazolam 0.25mg', notes: 'Counselling recommended' }
    ],
    'Meera Nair': [
      { id: 1, date: '2026-02-28', doctor: 'Dr. Arjun Mehta', diagnosis: 'Migraine', prescription: 'Sumatriptan 50mg', notes: 'Avoid bright screens' }
    ],
    'Aditya Rao': [
      { id: 1, date: '2026-01-20', doctor: 'Dr. Arjun Mehta', diagnosis: 'Annual checkup', prescription: 'Multivitamins', notes: 'All vitals normal' }
    ]
  },

  save() {
    localStorage.setItem('qt-appointments', JSON.stringify(this.appointments))
  },

  getQueue() {
    return [...this.appointments].sort((a, b) => b.urgencyScore - a.urgencyScore)
  },

  addAppointment(appt) {
    console.log('addAppointment received patientName:', appt.patientName);
    const keywords = appt.symptoms?.toLowerCase() || ''
    let urgencyScore = 1, urgencyLabel = 'Routine'
    if (/fever|chest|bleed|breath|seizure|stroke/.test(keywords)) { urgencyScore = 5; urgencyLabel = 'Acute' }
    else if (/vomit|severe|infection|fracture/.test(keywords)) { urgencyScore = 4; urgencyLabel = 'Urgent' }
    else if (/cough|headache|rash|dizz|back pain/.test(keywords)) { urgencyScore = 3; urgencyLabel = 'Medium' }
    const newAppt = {
      ...appt,
      id: appt.id || Date.now(),
      urgencyScore: appt.urgencyScore || urgencyScore,
      urgencyLabel: appt.urgencyLabel || urgencyLabel,
      status: 'pending',
      patientName: appt.patientName,
      patientId: appt.patientId || 3,
      age: appt.age,
      checkInTime: appt.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tokenNumber: null
    }
    this.appointments.push(newAppt)
    this.save()
    return newAppt
  },

  approveAppointment(id) {
    const a = this.appointments.find(a => a.id === id)
    if (a) { 
      a.status = 'confirmed'; 
      a.tokenNumber = this.getNextTokenNumber('T');
      this.save() 
      this.notifications.push({ id: Date.now(), userId: 3, message: `Your appointment at ${a.timeSlot} has been confirmed!`, type: 'confirmation', read: false, timestamp: new Date().toLocaleTimeString() })
    }
  },

  startConsultation(id) {
    const a = this.appointments.find(a => a.id === id)
    if (a) { a.status = 'in_progress'; this.save() }
  },

  completeConsultation(id) {
    const a = this.appointments.find(a => a.id === id)
    if (a) { a.status = 'completed'; this.save() }
  },

  cancelAppointment(id) {
    const a = this.appointments.find(a => a.id === id)
    if (a) { a.status = 'cancelled'; this.save() }
    this.notifications.push({ id: Date.now(), userId: 3, message: `Your appointment at ${a?.timeSlot} was cancelled. We will find you a new slot.`, type: 'cancellation', read: false, timestamp: new Date().toLocaleTimeString() })
  },

  removeFromQueue(id) {
    this.appointments = this.appointments.filter(a => a.id !== id);
    this.save();
  },

  rescheduleAppointment(id, newTimeSlot) {
    const a = this.appointments.find(a => a.id === id)
    if (a) { const old = a.timeSlot; a.timeSlot = newTimeSlot; a.status = 'rescheduled'; this.save()
    this.notifications.push({ id: Date.now(), userId: 3, message: `Your appointment moved from ${old} to ${newTimeSlot}.`, type: 'reschedule', read: false, timestamp: new Date().toLocaleTimeString() }) }
  },

  updateUrgency(id, score, label) {
    const a = this.appointments.find(a => a.id === id)
    if (a) { a.urgencyScore = score; a.urgencyLabel = label; this.save() }
  },

  getPatientHistory(name) {
    return this.patientHistory[name] || []
  },

  getNotificationsForUser(userId) {
    return this.notifications.filter(n => n.userId === userId)
  },

  markNotificationsRead(userId) {
    this.notifications.filter(n => n.userId === userId).forEach(n => n.read = true)
  },

  cancelByPatient(id, reason, requestedNewSlot) {
    const a = this.appointments.find(a => a.id === id)
    if (a) {
      a.status = 'cancellation_requested'
      a.cancelReason = reason
      a.requestedNewSlot = requestedNewSlot
      this.save()
      this.notifications.push({
        id: Date.now(),
        userId: 'receptionist',
        message: `${a.patientName} requested cancellation of ${a.timeSlot} slot. Reason: ${reason}. Requested new slot: ${requestedNewSlot || 'None'}.`,
        type: 'cancellation_request',
        read: false,
        timestamp: new Date().toLocaleTimeString()
      })
    }
  },

  addWalkIn(patientName, symptoms, urgencyScore, urgencyLabel, timeSlot, position, age) {
    const newAppt = {
      id: Date.now(),
      patientName,
      patientId: Date.now(),
      age,
      doctorId: 1,
      doctorName: 'Dr. Arjun Mehta',
      date: new Date().toISOString().split('T')[0],
      timeSlot,
      symptoms,
      urgencyScore,
      urgencyLabel,
      isPrivate: false,
      status: 'confirmed',
      isWalkIn: true,
      isEmergency: false,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tokenNumber: this.getNextTokenNumber('T')
    }
    this.appointments.splice(position - 1, 0, newAppt)
    this.save()
    return newAppt
  },

  addEmergency(patientName, reason, position) {
    const newAppt = {
      id: Date.now(),
      patientName,
      patientId: Date.now(),
      age: null,
      doctorId: 1,
      doctorName: 'Dr. Arjun Mehta',
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'IMMEDIATE',
      symptoms: reason,
      urgencyScore: 5,
      urgencyLabel: 'Acute',
      isPrivate: false,
      status: 'emergency',
      isWalkIn: true,
      isEmergency: true,
      emergencyReason: reason,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tokenNumber: this.getNextTokenNumber('E')
    }
    this.appointments.splice(0, 0, newAppt)
    this.save()
    this.notifications.push({
      id: Date.now(),
      userId: 'doctor',
      message: `EMERGENCY: ${patientName} inserted at top of queue. Reason: ${reason}`,
      type: 'emergency',
      read: false,
      timestamp: new Date().toLocaleTimeString()
    })
    this.notifications.push({
      id: Date.now() + 1,
      userId: 'receptionist',
      message: `Emergency slot inserted for ${patientName}. Reason: ${reason}`,
      type: 'emergency',
      read: false,
      timestamp: new Date().toLocaleTimeString()
    })
    return newAppt
  },

  confirmSmartGap() {
    this.smartGapActive = false
    this.save()
  }
}