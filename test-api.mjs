// Script to verify all CampusOS FixIt Backend APIs
// Usage: node test-api.mjs

const BASE_URL = 'https://campus-os-backend-8sjf.onrender.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(icon, method, endpoint, status, pass, info = '') {
  const color = pass ? colors.green : colors.red;
  console.log(
    `${icon} ${colors.bold}[${method.padEnd(6)}]${colors.reset} ${endpoint.padEnd(42)} -> Status: ${color}${status}${colors.reset}`
  );
  if (info) {
    console.log(`   ${colors.dim}↳ ${info}${colors.reset}`);
  }
}

async function run() {
  console.log(`\n${colors.cyan}${colors.bold}======================================================================`);
  console.log(` CampusOS - FixIt | Full Backend API Test Suite`);
  console.log(` Target: ${BASE_URL}/api/v1`);
  console.log(`======================================================================${colors.reset}\n`);

  let studentToken = null;
  let cmToken = null;
  let adminToken = null;
  let activeIssueTypeId = null;
  let createdTicketId = null;

  let passedCount = 0;
  let failedCount = 0;

  // 1. Health & OpenAPI Spec
  try {
    const res = await fetch(`${BASE_URL}/openapi.json`);
    const data = await res.json();
    const endpointCount = Object.keys(data.paths || {}).length;
    if (res.ok) {
      passedCount++;
      log('✅', 'GET', '/openapi.json', res.status, true, `OpenAPI spec loaded (${endpointCount} registered endpoints)`);
    } else {
      failedCount++;
      log('❌', 'GET', '/openapi.json', res.status, false);
    }
  } catch (err) {
    failedCount++;
    log('❌', 'GET', '/openapi.json', 'CONN_ERR', false, err.message);
  }

  // 2. Admin Login
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_id: 'admin@team42.com', otp: '472719' }),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      adminToken = data.access_token;
      passedCount++;
      log('✅', 'POST', '/auth/admin/login', res.status, true, `Admin Authenticated: ${data.profile?.name} (${data.profile?.role})`);
    } else {
      failedCount++;
      log('❌', 'POST', '/auth/admin/login', res.status, false, JSON.stringify(data));
    }
  } catch (err) {
    failedCount++;
    log('❌', 'POST', '/auth/admin/login', 'ERR', false, err.message);
  }

  // 3. Student Login (Mithun)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_id: 'mithun@team42.com', otp: '472719' }),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      studentToken = data.access_token;
      passedCount++;
      log('✅', 'POST', '/auth/login (Student)', res.status, true, `Student: ${data.profile?.name} [USN: ${data.profile?.usn}]`);
    } else {
      failedCount++;
      log('❌', 'POST', '/auth/login (Student)', res.status, false, JSON.stringify(data));
    }
  } catch (err) {
    failedCount++;
    log('❌', 'POST', '/auth/login (Student)', 'ERR', false, err.message);
  }

  // 4. CM / Campus Maintenance Login (Ravi)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_id: 'ravi@team42.com', otp: '472719' }),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      cmToken = data.access_token;
      passedCount++;
      log('✅', 'POST', '/auth/login (CM / Staff)', res.status, true, `Staff: ${data.profile?.name} [Dept: ${data.profile?.dept}]`);
    } else {
      failedCount++;
      log('❌', 'POST', '/auth/login (CM / Staff)', res.status, false, JSON.stringify(data));
    }
  } catch (err) {
    failedCount++;
    log('❌', 'POST', '/auth/login (CM / Staff)', 'ERR', false, err.message);
  }

  // 5. CM Create Issue Type: POST /fixit/issue-types
  if (cmToken) {
    try {
      const typeName = `Electrical & Wiring ${Date.now().toString().slice(-4)}`;
      const res = await fetch(`${BASE_URL}/api/v1/fixit/issue-types`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cmToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: typeName,
          description: 'Fans, lights, switches, and wiring issues',
        }),
      });
      const data = await res.json();
      if (res.status === 201 || res.status === 200) {
        passedCount++;
        activeIssueTypeId = data.issue_type_id || data.id;
        log('✅', 'POST', '/fixit/issue-types (CM)', res.status, true, `Created Issue Type: ${data.name} [ID: ${activeIssueTypeId}]`);
      } else {
        log('⚠️', 'POST', '/fixit/issue-types (CM)', res.status, true, JSON.stringify(data));
      }
    } catch (err) {
      log('❌', 'POST', '/fixit/issue-types (CM)', 'ERR', false, err.message);
    }
  }

  // 6. Fetch Issue Types: GET /fixit/issue-types
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fixit/issue-types`, {
      headers: { Authorization: `Bearer ${studentToken || adminToken}` },
    });
    const data = await res.json();
    const items = data.items || data;
    if (res.ok && Array.isArray(items)) {
      passedCount++;
      if (!activeIssueTypeId && items.length > 0) {
        activeIssueTypeId = items[0].issue_type_id || items[0].id;
      }
      log('✅', 'GET', '/fixit/issue-types', res.status, true, `Loaded ${items.length} issue types for dropdown`);
    } else {
      failedCount++;
      log('❌', 'GET', '/fixit/issue-types', res.status, false, JSON.stringify(data));
    }
  } catch (err) {
    failedCount++;
    log('❌', 'GET', '/fixit/issue-types', 'ERR', false, err.message);
  }

  // 7. Student Raise Ticket: POST /fixit/tickets (Form-Data)
  if (studentToken && activeIssueTypeId) {
    try {
      const fd = new FormData();
      fd.append('issue_type_id', activeIssueTypeId);
      fd.append('title', 'Ceiling fan malfunctioning in Room 304');
      fd.append('description', 'Fan regulator does not respond and makes loud squeaking noise.');

      const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: fd,
      });
      const data = await res.json();
      if (res.status === 201 && (data.ticket_id || data.id)) {
        createdTicketId = data.ticket_id || data.id;
        passedCount++;
        log('✅', 'POST', '/fixit/tickets (Raise)', res.status, true, `Ticket raised: ${createdTicketId} [Status: ${data.status}]`);
      } else {
        failedCount++;
        log('❌', 'POST', '/fixit/tickets (Raise)', res.status, false, JSON.stringify(data));
      }
    } catch (err) {
      failedCount++;
      log('❌', 'POST', '/fixit/tickets (Raise)', 'ERR', false, err.message);
    }
  }

  // 8. List Tickets: GET /fixit/tickets
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets`, {
      headers: { Authorization: `Bearer ${adminToken || cmToken}` },
    });
    const data = await res.json();
    const items = data.items || data;
    if (res.ok && Array.isArray(items)) {
      passedCount++;
      log('✅', 'GET', '/fixit/tickets', res.status, true, `Total active tickets: ${items.length}`);
    } else {
      failedCount++;
      log('❌', 'GET', '/fixit/tickets', res.status, false, JSON.stringify(data));
    }
  } catch (err) {
    failedCount++;
    log('❌', 'GET', '/fixit/tickets', 'ERR', false, err.message);
  }

  // 9. Filter Tickets by Status: GET /fixit/tickets?status=open
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets?status=open`, {
      headers: { Authorization: `Bearer ${studentToken || adminToken}` },
    });
    const data = await res.json();
    const items = data.items || data;
    if (res.ok && Array.isArray(items)) {
      passedCount++;
      log('✅', 'GET', '/fixit/tickets?status=open', res.status, true, `Open tickets count: ${items.length}`);
    } else {
      failedCount++;
      log('❌', 'GET', '/fixit/tickets?status=open', res.status, false, JSON.stringify(data));
    }
  } catch (err) {
    failedCount++;
    log('❌', 'GET', '/fixit/tickets?status=open', 'ERR', false, err.message);
  }

  // 10. CM Set Turnaround Time (TAT): PUT /fixit/tickets/{id}/tat
  if (createdTicketId && cmToken) {
    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets/${createdTicketId}/tat`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cmToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expected_by: tomorrow,
          note: 'Maintenance technician assigned for afternoon inspection',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        passedCount++;
        log('✅', 'PUT', `/fixit/tickets/{id}/tat`, res.status, true, `TAT set to: ${data.expected_by}`);
      } else {
        failedCount++;
        log('❌', 'PUT', `/fixit/tickets/{id}/tat`, res.status, false, JSON.stringify(data));
      }
    } catch (err) {
      failedCount++;
      log('❌', 'PUT', `/fixit/tickets/{id}/tat`, 'ERR', false, err.message);
    }
  }

  // 11. CM Update Status: PUT /fixit/tickets/{id}/status
  if (createdTicketId && cmToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets/${createdTicketId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cmToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'resolved',
          note: 'Capacitor and regulator replaced, tested and functional.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'resolved') {
        passedCount++;
        log('✅', 'PUT', `/fixit/tickets/{id}/status`, res.status, true, `Ticket marked RESOLVED`);
      } else {
        failedCount++;
        log('❌', 'PUT', `/fixit/tickets/{id}/status`, res.status, false, JSON.stringify(data));
      }
    } catch (err) {
      failedCount++;
      log('❌', 'PUT', `/fixit/tickets/{id}/status`, 'ERR', false, err.message);
    }
  }

  // 12. Student Acknowledge Ticket: POST /fixit/tickets/{id}/acknowledge
  if (createdTicketId && studentToken) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets/${createdTicketId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      if (res.ok && data.status === 'acknowledged') {
        passedCount++;
        log('✅', 'POST', `/fixit/tickets/{id}/acknowledge`, res.status, true, `Reporter acknowledged & closed ticket`);
      } else {
        failedCount++;
        log('❌', 'POST', `/fixit/tickets/{id}/acknowledge`, res.status, false, JSON.stringify(data));
      }
    } catch (err) {
      failedCount++;
      log('❌', 'POST', `/fixit/tickets/{id}/acknowledge`, 'ERR', false, err.message);
    }
  }

  // 13. Delete Ticket (Cleanup / CM or Admin): DELETE /fixit/tickets/{id}
  if (createdTicketId && (cmToken || adminToken)) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/fixit/tickets/${createdTicketId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cmToken || adminToken}` },
      });
      if (res.ok || res.status === 204) {
        passedCount++;
        log('✅', 'DELETE', `/fixit/tickets/{id}`, res.status, true, `Ticket ${createdTicketId} cleaned up`);
      } else {
        log('⚠️', 'DELETE', `/fixit/tickets/{id}`, res.status, false);
      }
    } catch (err) {
      log('❌', 'DELETE', `/fixit/tickets/{id}`, 'ERR', false, err.message);
    }
  }

  console.log(`\n${colors.cyan}${colors.bold}======================================================================`);
  console.log(` Summary: ${colors.green}${passedCount} Passed${colors.cyan} | ${failedCount > 0 ? colors.red : colors.dim}${failedCount} Failed${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}======================================================================${colors.reset}\n`);
}

run();
