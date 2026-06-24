# QueueTonic — Appointment Intelligence

**TechBlitz26 · Team SnackOverflow**

## What is QueueTonic?
QueueTonic is a role-based clinical appointment scheduling platform that brings intelligence to healthcare queue management. It connects doctors, receptionists, and patients in one unified system — each seeing only what's relevant to their role.

## Features
- **AI Urgency Triage** — patients describe symptoms, system scores urgency in real time (Routine → Medium → Urgent → Acute) and auto-prioritizes acute cases to earliest slots
- **Smart Gap Filler** — when a patient cancels, system automatically identifies waitlist candidates and sends WhatsApp offers to fill the slot
- **Patient History** — doctors see full medical history before consultation begins
- **Private Slots** — sensitive consultations hidden from reception, visible to doctor only
- **One-Tap Reschedule** — when consultation overruns, cascade reschedule all affected patients with one click
- **Emergency Override** — receptionist can insert critical walk-ins at any queue position with full audit trail
- **Role-Based Access** — doctor sees clinical data, receptionist sees scheduling only, patient sees their own records
- **WhatsApp Bot** — conversational booking, reminders and notifications
- **Real-time Notifications** — every action triggers contextual notifications to the right role

## Tech Stack
- **Frontend** — React.js, Vite, React Router, CSS Modules
- **State Management** — Shared in-memory store with localStorage persistence
- **Backend** — Node.js + Express (API layer built, ready for database integration)
- **Notifications** — Twilio (WhatsApp + SMS), Nodemailer (Email) — mock-safe for demo

## Demo Credentials
Just click **Sign In** on any portal — demo mode, no credentials needed.

## Run Locally

```bash
# Frontend
npm install
npm run dev

# Backend
cd backend
npm install
node server.js
```

## Team
Built at **TechBlitz26 Hackathon** by **Team SnackOverflow**
