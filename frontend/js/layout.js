/**
 * layout.js — Bouwt dynamisch de header en sidebar per rol via innerHTML
 */

/* ── SVG-iconen ── */
const ico = {
  dashboard:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  stage:      `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  logboek:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  evaluatie:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  studenten:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  aanvragen:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  competenties:`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  gebruikers: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  stages:     `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  logout:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

/* ── Navigatiestructuur per rol ── */
const NAV = {
  student: [
    { hash: 'student/dashboard',      label: 'Dashboard',       icon: ico.dashboard  },
    { hash: 'student/stage-indienen', label: 'Stage indienen',  icon: ico.stage      },
    { hash: 'student/logboek',        label: 'Logboek',         icon: ico.logboek    },
    { hash: 'student/evaluatie',      label: 'Evaluatie',       icon: ico.evaluatie  },
  ],
  docent: [
    { hash: 'docent/dashboard',  label: 'Dashboard',       icon: ico.dashboard  },
    { hash: 'docent/studenten',  label: 'Mijn studenten',  icon: ico.studenten  },
    { hash: 'docent/logboeken',  label: 'Logboeken',       icon: ico.logboek    },
    { hash: 'docent/evaluatie',  label: 'Evaluaties',      icon: ico.evaluatie  },
  ],
  stagecommissie: [
    { hash: 'stagecommissie/dashboard',   label: 'Dashboard',    icon: ico.dashboard    },
    { hash: 'stagecommissie/aanvragen',   label: 'Aanvragen',    icon: ico.aanvragen    },
    { hash: 'stagecommissie/competenties',label: 'Competenties', icon: ico.competenties },
  ],
  mentor: [
    { hash: 'mentor/dashboard', label: 'Dashboard', icon: ico.dashboard },
    { hash: 'mentor/logboeken', label: 'Logboeken', icon: ico.logboek   },
    { hash: 'mentor/evaluatie', label: 'Evaluaties',icon: ico.evaluatie },
  ],
  admin: [
    { hash: 'admin/dashboard',  label: 'Dashboard',    icon: ico.dashboard  },
    { hash: 'admin/gebruikers', label: 'Gebruikers',   icon: ico.gebruikers },
    { hash: 'admin/stages',     label: 'Alle stages',  icon: ico.stages     },
  ],
};

const ROL_LABELS = {
  student:        'Student',
  docent:         'Docent',
  stagecommissie: 'Stagecommissie',
  mentor:         'Stagementor',
  admin:          'Admin',
};

/**
 * Bouwt de header HTML-string voor de gegeven rol.
 */
export function buildHeader(rol) {
  return `
    <div class="header-logo">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <span class="header-logo-text">Stageplatform</span>
    </div>
    <div class="header-actions">
      <span class="header-rol-badge">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        ${ROL_LABELS[rol] ?? rol}
      </span>
      <button class="btn-terug" onclick="window.__terug()">
        ${ico.logout}
        Wissel van rol
      </button>
    </div>
  `;
}

/**
 * Bouwt de sidebar HTML-string voor de gegeven rol en actieve hash.
 */
export function buildSidebar(rol, activeHash) {
  const items = NAV[rol] ?? [];
  return items.map(item => `
    <a href="#${item.hash}"
       class="nav-item${activeHash === item.hash ? ' actief' : ''}"
       data-hash="${item.hash}">
      ${item.icon}
      <span>${item.label}</span>
    </a>
  `).join('');
}
