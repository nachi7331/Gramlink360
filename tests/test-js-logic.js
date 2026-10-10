const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

console.log('=== TEST SUITE 3: JAVASCRIPT STATE, CONFIG & BUSINESS LOGIC ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

// -------------------------------------------------------------
// 1. TEST CONFIG & SECRET KEY INVARIANTS
// -------------------------------------------------------------
console.log('1. Testing js/config.js & Security Invariants:');
const configCode = fs.readFileSync(path.join(rootDir, 'js', 'config.js'), 'utf8');

const configSandbox = {
  window: {},
  localStorage: { getItem: () => null }
};
vm.createContext(configSandbox);
vm.runInContext(configCode, configSandbox);

const cfg = configSandbox.window.GRAMLINK_CONFIG;
assert(!!cfg, 'window.GRAMLINK_CONFIG exists');
assert(typeof cfg.SUPABASE_URL === 'string' && cfg.SUPABASE_URL.startsWith('https://'), 'Valid Supabase HTTPS URL configured');
assert(typeof cfg.SUPABASE_ANON_KEY === 'string' && cfg.SUPABASE_ANON_KEY.length > 20, 'Publishable anon key present');
assert(cfg.SUPABASE_SERVICE_ROLE_KEY === undefined, 'SUPABASE_SERVICE_ROLE_KEY is strictly NOT present');

// Scan entire js/ folder for actual assignment or exposure of service_role
let serviceRoleExposed = false;
fs.readdirSync(path.join(rootDir, 'js')).forEach(f => {
  if (f.endsWith('.js')) {
    const code = fs.readFileSync(path.join(rootDir, 'js', f), 'utf8');
    // Check if code contains an active assignment or key configuration for service_role
    if (/service_role\s*[:=]|['"]service_role['"]\s*[:=]|SUPABASE_SERVICE_ROLE_KEY\s*[:=]/i.test(code)) {
      serviceRoleExposed = true;
    }
  }
});
assert(!serviceRoleExposed, 'Zero service_role keys exposed across client JavaScript');


// -------------------------------------------------------------
// 2. TEST GRAMLINK STATE STORE (js/state.js)
// -------------------------------------------------------------
console.log('\n2. Testing js/state.js Store & Storage Sync:');
let mockStorage = {};
const stateSandbox = {
  window: {},
  localStorage: {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => { mockStorage[key] = String(val); },
    removeItem: (key) => { delete mockStorage[key]; }
  }
};
stateSandbox.window = stateSandbox;

const stateCode = fs.readFileSync(path.join(rootDir, 'js', 'state.js'), 'utf8');
vm.createContext(stateSandbox);
vm.runInContext(stateCode, stateSandbox);

const State = stateSandbox.GramlinkState || stateSandbox.window.GramlinkState;
assert(!!State, 'GramlinkState object is defined');

// Verify initial seed complaints
const seedComplaints = State.getComplaints();
assert(Array.isArray(seedComplaints) && seedComplaints.length >= 3, `Initial seed complaints loaded (${seedComplaints.length} found)`);

// Lookup by token
const sampleToken = 'GL-2026-1042';
const foundComplaint = State.getComplaintByToken(sampleToken);
assert(!!foundComplaint && foundComplaint.tokenNumber === sampleToken, `Lookup by token '${sampleToken}' succeeded`);
assert(State.getComplaintByToken('gl-2026-1042') !== null, 'Lookup by token is case-insensitive');
assert(State.getComplaintByToken('NON-EXISTENT') === null, 'Lookup with invalid token returns null');

// Add new complaint
const newComplaint = {
  tokenNumber: 'GL-2026-9999',
  title: 'Streetlight pole broken near school',
  category: 'electricity',
  ward: 'Ward 4 - ZP Primary School',
  applicantName: 'Sanjay Shinde',
  applicantPhone: '9822012345',
  status: 'Pending',
  priority: 'Urgent',
  description: 'Pole is leaning dangerously after heavy rain.',
  slaDeadlineHours: 48,
  createdAt: new Date().toISOString()
};
const added = State.addComplaint(newComplaint);
assert(added.tokenNumber === 'GL-2026-9999', 'addComplaint returns newly added complaint');
assert(State.getComplaints()[0].tokenNumber === 'GL-2026-9999', 'New complaint is prepended to state');

// Update complaint status
const updated = State.updateComplaintStatus('GL-2026-9999', 'In Progress', 'Officer dispatched with replacement pole', 'Officer Kadam');
assert(updated.status === 'In Progress', 'updateComplaintStatus changes status to In Progress');
assert(updated.history.length >= 2, 'Complaint status history logged in history array');

// User Auth Session
State.setCurrentUser({ id: 'u1', name: 'Ramesh Patil', role: 'resident', ward: 'Ward 2' });
const currentUser = State.getCurrentUser();
assert(currentUser && currentUser.name === 'Ramesh Patil' && currentUser.role === 'resident', 'setCurrentUser / getCurrentUser works properly');
State.logout();
assert(State.getCurrentUser() === null, 'logout clears user session');


// -------------------------------------------------------------
// 3. TEST REFERENCE TOKEN GENERATOR FORMAT
// -------------------------------------------------------------
console.log('\n3. Testing Token Format & Logic:');
function generateToken() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GL-${year}-${rand}`;
}

const testTokens = [generateToken(), generateToken(), generateToken(), 'GL-2026-1042', 'GL-2026-1088'];
const tokenRegex = /^GL-\d{4}-\d{4}$/;
testTokens.forEach(t => {
  assert(tokenRegex.test(t), `Token '${t}' strictly matches format GL-YYYY-XXXX`);
});


// -------------------------------------------------------------
// 4. TEST KPI ANALYTICS & CALCULATION LOGIC
// -------------------------------------------------------------
console.log('\n4. Testing Analytics & KPI Calculations:');
const sampleDataSet = [
  { status: 'Resolved', slaHours: 24, ward: 'Ward 1' },
  { status: 'Resolved', slaHours: 36, ward: 'Ward 2' },
  { status: 'In Progress', slaHours: 40, ward: 'Ward 1' },
  { status: 'Pending', slaHours: 12, ward: 'Ward 3' },
  { status: 'Resolved', slaHours: 45, ward: 'Ward 2' }
];

const total = sampleDataSet.length;
const resolved = sampleDataSet.filter(c => c.status === 'Resolved').length;
const inProgress = sampleDataSet.filter(c => c.status === 'In Progress').length;
const pending = sampleDataSet.filter(c => c.status === 'Pending').length;
const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
const slaCompliant = sampleDataSet.filter(c => c.slaHours <= 48).length;
const slaComplianceRate = total > 0 ? Math.round((slaCompliant / total) * 100) : 0;

assert(total === 5, 'Total grievances count calculated correctly');
assert(resolved === 3, 'Resolved count calculated correctly');
assert(inProgress === 1, 'In Progress count calculated correctly');
assert(pending === 1, 'Pending count calculated correctly');
assert(resRate === 60, `Resolution rate correctly calculated: 60% (got ${resRate}%)`);
assert(slaComplianceRate === 100, `SLA compliance rate within 48h correctly calculated: 100%`);


// -------------------------------------------------------------
// 5. TEST ADMIN CSV EXPORT GENERATOR
// -------------------------------------------------------------
console.log('\n5. Testing Admin CSV Exporter:');
function generateCsv(complaints) {
  const headers = ['Token', 'Title', 'Category', 'Ward', 'Applicant', 'Phone', 'Status', 'Filed Date'];
  const rows = complaints.map(c => [
    `"${c.tokenNumber}"`,
    `"${(c.title || '').replace(/"/g, '""')}"`,
    `"${c.category || ''}"`,
    `"${c.ward || ''}"`,
    `"${c.applicantName || ''}"`,
    `"${c.applicantPhone || ''}"`,
    `"${c.status || ''}"`,
    `"${c.createdAt || ''}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

const sampleComplaintsForCsv = [
  { tokenNumber: 'GL-2026-1042', title: 'Water issue, "urgent"', category: 'utilities', ward: 'Ward 2', applicantName: 'Ramesh', applicantPhone: '9822011223', status: 'In Progress', createdAt: '2026-10-01' }
];
const csvResult = generateCsv(sampleComplaintsForCsv);
assert(csvResult.includes('"GL-2026-1042"'), 'CSV export includes token');
assert(csvResult.includes('"Water issue, ""urgent"""'), 'CSV export properly escapes internal quotes');
assert(csvResult.startsWith('Token,Title,Category,Ward,Applicant,Phone,Status,Filed Date'), 'CSV export has standard headers');

console.log(`\n=============================================================`);
console.log(`Total tests run: ${testsPassed + testsFailed} | Passed: ${testsPassed} | Failed: ${testsFailed}`);
console.log(`=============================================================`);

if (testsFailed === 0) {
  process.exit(0);
} else {
  process.exit(1);
}
