# QueueTonic: Project Prompts & Construction History

This document chronicles the step-by-step instructions and prompts used to build **QueueTonic**, a modern healthcare appointment scheduling platform featuring role-based dashboards (Patient, Receptionist, Doctor) and real-time state management.

---

## 1. Project Overview & Concept

**Initial Prompt / Concept Request:**
> "Build a React.js single-page application called QueueTonic, a doctor scheduling system. This involves setting up the project, implementing four distinct views (Landing Page, Doctor Dashboard, Receptionist Dashboard, Patient Dashboard) with role-based access, and applying a global design system for fonts, colors, and UI elements. Ensure all transitions are smooth and in-app, with animations and polish applied as specified. The implementation should follow a backend contract and utilize React Context for state management."

**Core Value Proposition:**
QueueTonic is designed to eliminate waiting room friction by providing live queue tracking for patients, AI-driven triage and smart gap auto-filling for receptionists, and clean, actionable schedules and patient history views for doctors.

---

## 2. Tech Stack Decisions

**Prompt / Stack Definition:**
> "Use the following tech stack: React.js for the frontend, Node.js + Express for the backend, and PostgreSQL for the database. Use plain CSS modules for styling, maintaining a premium aesthetic with specific fonts (Inter/Outfit). Avoid Tailwind CSS unless necessary. Ensure the frontend is a purely decoupled SPA."

**Final Stack:**
- **Frontend:** React (Vite), React Router DOM, CSS Modules
- **Backend (Initial):** Node.js, Express, PostgreSQL, bcrypt, jsonwebtoken
- **Backend (Final Demo Version):** Node.js, Express, JSON File Storage (mocking a database for zero-dependency local demos)
- **State Management:** Custom `demoStore.js` (Class-based/Object singleton) utilizing `localStorage` persistence.

---

## 3. Implementation Phases & Feature Prompts

### Phase 1: Frontend Foundation & UI Shell
**Instructions given:**
1. "Set up the Vite React project and define the design system in `index.css` (variables for colors, modern typography)."
2. "Build the Landing Page with a hero section, feature highlights, and a unified Authentication Modal utilizing a tabbed or role-selected login approach."
3. "Create basic placeholder shells for the Patient, Receptionist, and Doctor dashboards with standard Sidebar navigation and responsive wrappers."

### Phase 2: Backend API & Database (Iterative Build)
**Instructions given:**
1. "Develop a robust Node.js/Express/PostgreSQL backend for the QueueTonic platform."
2. "Implement JWT-based authentication and authorization with role-based endpoint guards."
3. "Define the database schema (Users, Appointments, Notifications) and seed it with mock data."
4. "Create API endpoints for managing appointments, updating queues, and fetching user profiles."
5. *(Later Update)* "Replace the entire PostgreSQL database layer with JSON file storage so the backend can run locally with zero dependencies (using `fs.readFileSync` and `fs.writeFileSync`)."

### Phase 3: The Demo State Store (`demoStore.js`)
**Instructions given:**
To simplify the live demonstration and ensure instant, snappy UI updates without relying heavily on API latencies or specific backend setups:
1. "Wire all three dashboards to use a shared `src/store/demoStore.js` file instead of any API calls or mock data. This is the single source of truth for the demo flow."
2. "In Modal.jsx, bypass all API calls and authentication entirely for now. When the user clicks the Sign In / Continue button, immediately navigate to the correct dashboard based on which modal is open."
3. "Store initial mockup data in the store, and parse it back and forth to `localStorage` under `qt-appointments`."

### Phase 4: Patient Dashboard Features
**Instructions given:**
1. "On form submit, call `store.addAppointment` which calculates an Urgency Score based on keywords in the patient's symptoms (e.g., 'fever/chest/pain' = 5/Acute)."
2. "Add an inline cancellation form allowing the patient to request cancellations with a requested new slot if needed."
3. "Hydrate the Health History and Notifications panels using the `demoStore`."

### Phase 5: Receptionist Dashboard Features
**Instructions given:**
1. "Add an inline Walk-In form that takes Name, Age, Symptoms, Urgency, and Slot to prepend patients into the queue."
2. "Implement the Smart Gap Automation panel. Show a waitlist matching queue. Add buttons to confirm the gap, fire a Toast notification simulating a WhatsApp text being sent."
3. "Build the Emergency Override UI to insert critical cases instantly to the front of the line, notifying doctors."
4. "Ensure 'Cancel Requested' rows show 'Approve' and 'Deny' buttons instead of standard workflow controls."

### Phase 6: Doctor Dashboard Features
**Instructions given:**
1. "Make KPI cards clickable to route the doctor to respective panels (Schedule, Urgency Queue, Private Slots)."
2. "Implement accordion-style expandable menus in the Patient History panel giving longitudinal records."
3. "Highlight EMERGENCY and WALK-IN patients with distinct colored pill badges on the Schedule."
4. "Allow the doctor to dynamically change a patient's Urgency directly from a dropdown on the Schedule row."

### Phase 7: UI Polish & Feedback Replacements
**Instructions given:**
1. "Replace all native `alert()` calls across the platform with a custom, globally accessible `<Toast />` component that slides in and auto-hides after 3 seconds."
2. "Update the Sidebar to dynamically calculate and display unread notification counts for the Doctor and Receptionist."

---

## 4. The Ideal Demo Flow

When presenting this project, follow this chronological script to show off the system's capabilities:

1. **The Landing Page:** Launch the app. Demonstrate the clean UI.
2. **Patient Booking:** Open the Patient Login. Book a new appointment, typing critical symptoms like "Chest pain and fever". Show how the UI reacts and assigns an "Acute" triage score instantly.
3. **Queue Visibility:** Use the Track My Turn button to see live status updates.
4. **Reception View:** Open a new tab as Receptionist. See the patient instantly jump to the top of the Queue list due to triage. 
5. **Smart Gap:** As the receptionist, pretend a patient cancelled. Open the Smart Gap tool to auto-match the newly freed slot with a waitlisted patient (Waitlist Auto-Offer Queue).
6. **Walk-Ins & Emergencies:** Use the walk-in form. Then immediately fire an Emergency Override and show the audit log updating.
7. **Doctor View:** Open the Doctor login. View the Schedule and see the Emergency patient badged in red. Use the inline Patient History drawer to read their past visits. Start the consultation.

---
*Generated by Antigravity Assistant.*
