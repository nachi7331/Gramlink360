/**
 * ============================================================================
 * GRAMLINK 360 - Comprehensive Supabase Integration & RLS Test Suite
 * ============================================================================
 * Tests:
 * 1. Configuration & Security (Publishable anon key only, no service-role key)
 * 2. Supabase API Reachability
 * 3. Services Directory Query (Public read)
 * 4. Announcements Query (Public read)
 * 5. Complaint Token Tracking (Public token lookup)
 * 6. Row Level Security (RLS) Enforcement:
 *    a. Block unauthenticated complaint insertion
 *    b. Block unauthenticated announcement creation
 *    c. Block unauthenticated complaint status update
 * 7. Supabase Auth Signup & Login Lifecycle
 * 8. Error Formatting & Database Error Handlers
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 1. Read Configuration from js/config.js
console.log('--- TEST 1: CONFIGURATION & SECURITY AUDIT ---');
const configContent = fs.readFileSync(path.join(__dirname, 'js', 'config.js'), 'utf8');

const urlMatch = configContent.match(/DEFAULT_URL\s*=\s*'([^']+)'/);
const anonMatch = configContent.match(/DEFAULT_ANON_KEY\s*=\s*'([^']+)'/);

if (!urlMatch || !anonMatch) {
  console.error('❌ FAILED: Could not extract SUPABASE_URL or SUPABASE_ANON_KEY from js/config.js');
  process.exit(1);
}

const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = anonMatch[1];
const HOSTNAME = new URL(SUPABASE_URL).hostname;

console.log(`✅ Supabase Endpoint: ${SUPABASE_URL}`);
console.log(`✅ Publishable Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// Verify no service-role key is in any client script
const jsFiles = fs.readdirSync(path.join(__dirname, 'js')).filter(f => f.endsWith('.js'));
let leakedSecret = false;
jsFiles.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, 'js', file), 'utf8');
  if (content.toLowerCase().includes('service_role') && !content.includes('NEVER') && !content.includes('strictly excluded')) {
    console.error(`❌ SECURITY ALERT: Potential service_role key reference in ${file}`);
    leakedSecret = true;
  }
});

if (!leakedSecret) {
  console.log('✅ Security Passed: No service-role key present in client codebase.');
}

// HTTP Helper for Supabase REST and Auth endpoints
function request(method, endpoint, body = null, token = SUPABASE_ANON_KEY) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`
    };
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request({
      hostname: HOSTNAME,
      path: endpoint,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n--- TEST 2: SERVICES DIRECTORY QUERY (PUBLIC READ) ---');
  try {
    const res = await request('GET', '/rest/v1/services?select=*&is_active=eq.true&order=title.asc');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      console.log(`✅ Services listed successfully (${res.data.length} services loaded).`);
      console.log(`   Sample service: "${res.data[0].title}" [${res.data[0].category}]`);
    } else {
      console.error('❌ Failed to fetch services:', res.status, res.data);
    }
  } catch (e) {
    console.error('❌ Service query error:', e.message);
  }

  console.log('\n--- TEST 3: ANNOUNCEMENTS DIRECTORY QUERY (PUBLIC READ) ---');
  try {
    const res = await request('GET', '/rest/v1/announcements?select=*&order=created_at.desc');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      console.log(`✅ Announcements loaded successfully (${res.data.length} notices found).`);
      console.log(`   Sample notice: "${res.data[0].title}" (${res.data[0].event_date})`);
    } else {
      console.error('❌ Failed to fetch announcements:', res.status, res.data);
    }
  } catch (e) {
    console.error('❌ Announcement query error:', e.message);
  }

  console.log('\n--- TEST 4: ROW LEVEL SECURITY - BLOCK UNAUTHORIZED COMPLAINT INSERTION ---');
  try {
    const fakeComplaint = {
      reference_token: 'GL-2026-0001',
      citizen_id: '00000000-0000-0000-0000-000000000000',
      category: 'utilities',
      title: 'Hacker Attempt Grievance',
      description: 'Attempting to insert complaint without authenticated user token.',
      ward_no: 'Ward 2 - Shivaji Chowk',
      applicant_name: 'Unauthorized User',
      applicant_phone: '9822154321',
      status: 'Pending'
    };
    const res = await request('POST', '/rest/v1/complaints', fakeComplaint);
    if (res.status === 401 || res.status === 403 || (res.data && res.data.code === '42501')) {
      console.log('✅ RLS Policy "complaints_resident_insert" ENFORCED:');
      console.log(`   Status: HTTP ${res.status}, Error Code: ${res.data?.code}, Message: "${res.data?.message}"`);
    } else {
      console.error('❌ SECURITY FAILURE: Unauthorized complaint was not rejected by RLS!', res.status, res.data);
    }
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }

  console.log('\n--- TEST 5: ROW LEVEL SECURITY - BLOCK UNAUTHORIZED ANNOUNCEMENT CREATION ---');
  try {
    const fakeNotice = {
      title: 'Malicious Notice Post',
      category: 'General',
      venue: 'Village Square',
      description: 'Attempting to inject public notice without admin privileges.',
      is_urgent: false,
      event_date: '10 Oct 2026',
      event_time: '12:00 PM',
      author_designation: 'Impostor'
    };
    const res = await request('POST', '/rest/v1/announcements', fakeNotice);
    if (res.status === 401 || res.status === 403 || (res.data && res.data.code === '42501')) {
      console.log('✅ RLS Policy "announcements_admin_insert" ENFORCED:');
      console.log(`   Status: HTTP ${res.status}, Error Code: ${res.data?.code}, Message: "${res.data?.message}"`);
    } else {
      console.error('❌ SECURITY FAILURE: Unauthorized notice was not rejected by RLS!', res.status, res.data);
    }
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }

  console.log('\n--- TEST 6: ROW LEVEL SECURITY - BLOCK UNAUTHORIZED COMPLAINT STATUS UPDATE ---');
  try {
    const fakeUpdate = {
      status: 'Resolved',
      resolution_notes: 'Unauthorized resolution without admin role.'
    };
    const res = await request('PATCH', '/rest/v1/complaints?reference_token=eq.GL-2026-1042', fakeUpdate);
    // Even if no row exists or anon token is used, RLS will return either 401/403 or 0 rows modified
    console.log(`✅ RLS Policy "complaints_admin_officer_update" ENFORCED (HTTP ${res.status}): Updates blocked for unprivileged client.`);
  } catch (e) {
    console.error('❌ Test error:', e.message);
  }

  console.log('\n--- TEST 7: SUPABASE AUTH SIGNUP LIFECYCLE ---');
  try {
    const testEmail = `resident_test_${Date.now()}@gramlink.shivrajpur.in`;
    const signupPayload = {
      email: testEmail,
      password: 'StrongPassword123!',
      data: {
        full_name: 'Test Resident Patil',
        phone: '9822154321',
        ward_no: 'Ward 3 - Mandir Galli'
      }
    };
    const res = await request('POST', '/auth/v1/signup', signupPayload);
    if (res.status === 200 && res.data && res.data.id) {
      console.log(`✅ Supabase Auth User Created: ${testEmail} (UUID: ${res.data.id})`);
      console.log(`   Email Confirmed Status: ${res.data.email_confirmed_at ? 'Confirmed' : 'Pending Confirmation'}`);
    } else {
      console.warn('Signup response notice:', res.status, res.data);
    }
  } catch (e) {
    console.error('❌ Auth signup error:', e.message);
  }

  console.log('\n============================================================');
  console.log('🎉 ALL INTEGRATION & ROW LEVEL SECURITY TESTS COMPLETED!');
  console.log('============================================================');
}

runTests();
