const API_BASE = '/api';

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function registerUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    throw new Error('Failed to fetch dashboard metrics');
  }
  return res.json();
}

export async function fetchMeetings(search = '') {
  const url = search ? `${API_BASE}/meetings?search=${encodeURIComponent(search)}` : `${API_BASE}/meetings`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meetings list');
  return res.json();
}

export async function fetchMeetingDetails(id) {
  const res = await fetch(`${API_BASE}/meetings/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch meeting details');
  return res.json();
}

export async function createMeeting(payload) {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to analyze meeting transcript');
  }
  return res.json();
}

export async function createAudioMeeting(formData) {
  const res = await fetch(`${API_BASE}/meetings/audio`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to process audio file');
  }
  return res.json();
}

export async function createFileMeeting(formData) {
  const res = await fetch(`${API_BASE}/meetings/upload`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: formData
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to process transcript file');
  }
  return res.json();
}

export async function deleteMeeting(id) {
  const res = await fetch(`${API_BASE}/meetings/${id}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete meeting');
  return true;
}

export async function fetchActionItems(filters = {}) {
  const query = new URLSearchParams();
  if (filters.status && filters.status !== 'All') query.append('status', filters.status);
  if (filters.priority && filters.priority !== 'All') query.append('priority', filters.priority);
  if (filters.owner && filters.owner.trim()) query.append('owner', filters.owner.trim());
  if (filters.search && filters.search.trim()) query.append('search', filters.search.trim());
  if (filters.meeting_id) query.append('meeting_id', filters.meeting_id);

  const res = await fetch(`${API_BASE}/action-items?${query.toString()}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch action items');
  return res.json();
}

export async function createActionItem(payload) {
  const res = await fetch(`${API_BASE}/action-items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to create action item');
  return res.json();
}

export async function updateActionItem(id, updates) {
  const res = await fetch(`${API_BASE}/action-items/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update action item');
  return res.json();
}

export async function deleteActionItem(id) {
  const res = await fetch(`${API_BASE}/action-items/${id}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete action item');
  return true;
}

export async function askMeetingQuestion(meetingId, query) {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to get answer from AI');
  }
  return res.json();
}

export async function seedSampleData() {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to seed sample data');
  return res.json();
}

export async function resetDatabase() {
  const res = await fetch(`${API_BASE}/seed`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}
