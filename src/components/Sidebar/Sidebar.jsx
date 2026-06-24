import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import styles from './Sidebar.module.css';
import { store } from '../../store/demoStore';

const Sidebar = ({ role, activePanel, onPanelChange, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const getRoleAbbr = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts[0].toLowerCase() === 'dr.' && parts[1]) return parts[1].substring(0, 2).toUpperCase();
    return parts.map(p => p[0]).join('').toUpperCase();
  };

  const menuItems = {
    doctor: [
      { section: 'Overview', items: [
        { id: 'overview', label: 'Dashboard', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        )}
      ]},
      { section: 'Clinical', items: [
        { id: 'schedule', label: "Today's Schedule", badge: '8', badgeColor: 'green', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        )},
        { id: 'urgency', label: 'Urgency Queue', badge: '2', badgeColor: 'red', icon: (
          <svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        )},
        { id: 'history', label: 'Patient History', icon: (
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        )},
        { id: 'private', label: 'Private Slots', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        )}
      ]},
      { section: 'Clinic', items: [
        { id: 'map', label: 'Clinic Map', icon: (
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        )},
        { id: 'notifications', label: 'Notifications', badge: store.getNotificationsForUser('doctor').filter(n => !n.read).length > 0 ? store.getNotificationsForUser('doctor').filter(n => !n.read).length : null, badgeColor: 'green', icon: (
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        )}
      ]}
    ],
    receptionist: [
      { section: 'Overview', items: [
        { id: 'overview', label: 'Dashboard', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        )}
      ]},
      { section: 'Patients', items: [
        { id: 'queue', label: 'Patient Queue', badge: String(store.appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length), badgeColor: 'blue', icon: (
          <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        )}
      ]},
      { section: 'Tools', items: [
        { id: 'smartgap', label: 'Smart Gap', badge: '1', badgeColor: 'blue', icon: (
          <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        )},
        { id: 'reschedule', label: 'One-Tap Reschedule', icon: (
          <svg viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
        )},
        { id: 'whatsapp', label: 'WhatsApp Bot', icon: (
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        )},
        { id: 'emergency', label: 'Emergency Override', icon: (
          <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        )}
      ]},
      { section: 'Clinic', items: [
        { id: 'map', label: 'Clinic Map', icon: (
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        )},
        { id: 'notifications', label: 'Notifications', badge: store.getNotificationsForUser('receptionist').filter(n => !n.read).length > 0 ? store.getNotificationsForUser('receptionist').filter(n => !n.read).length : null, badgeColor: 'blue', icon: (
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        )}
      ]}
    ],
    patient: [
      { section: 'My Health', items: [
        { id: 'overview', label: 'My Dashboard', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        )},
        { id: 'appointments', label: 'My Appointments', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        )},
        { id: 'book', label: 'Book Appointment', icon: (
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        )},
        { id: 'history', label: 'Health History', icon: (
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        )}
      ]},
      { section: 'Preferences', items: [
        { id: 'private', label: 'Private Booking', icon: (
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        )},
        { id: 'map', label: 'Find My Room', icon: (
          <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        )},
        { id: 'notifications', label: 'Notifications', badge: store.getNotificationsForUser(3).filter(n => !n.read).length > 0 ? store.getNotificationsForUser(3).filter(n => !n.read).length : null, badgeColor: 'pat', icon: (
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        )}
      ]}
    ]
  };

  const sections = menuItems[role] || [];
  const rolePrefix = role === 'receptionist' ? 'rec' : role === 'doctor' ? 'doc' : 'pat';

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sbHeader}>
        <span className={styles.sbLogo}>QueueTonic</span>
        <button className={styles.sbToggle} onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.sbRole}>
        <div className={styles.sbRolePill}>
          <div className={`${styles.roleAv} ${styles[rolePrefix]}`}>{getRoleAbbr(user?.name)}</div>
          <div className={styles.sbRoleInfo}>
            <div className={styles.sbRoleName}>{user?.name || 'Guest'}</div>
            <div className={styles.sbRoleType}>
              {role === 'doctor' ? 'Doctor · General' : role === 'receptionist' ? 'Receptionist' : 'Patient'}
            </div>
          </div>
        </div>
      </div>

      <nav className={styles.sbNav}>
        {sections.map((section, sidx) => (
          <React.Fragment key={sidx}>
            <div className={styles.sbSection}>{section.section}</div>
            {section.items.map((item) => (
              <a
                key={item.id}
                href="#"
                className={`${styles.navItem} ${activePanel === item.id ? styles.active : ''} ${styles[rolePrefix + 'Nav']}`}
                onClick={(e) => {
                  e.preventDefault();
                  onPanelChange(item.id);
                }}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && (
                  <span className={`${styles.navBadge} ${styles[item.badgeColor] || ''}`}>
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </React.Fragment>
        ))}
      </nav>

      <div className={styles.sbFooter}>
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
        </button>
        <div className={styles.sbExit} onClick={() => {
          localStorage.removeItem('qt-token');
          localStorage.removeItem('qt-role');
          localStorage.removeItem('qt-name');
          navigate('/');
        }}>
          <svg viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span className={styles.sbExitLabel}>Exit Portal</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
