// Vercel Serverless Function — Contact Form Submissions
// Receives POST data, validates, logs, and stores in /tmp

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'contact-submissions.json');

function readSubmissions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) { /* ignore */ }
  return [];
}

function writeSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, affiliation, subject, message, reason } = req.body || {};

    // Validate required fields
    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Full name is required (min 2 characters).';
    if (!email || !validateEmail(email)) errors.email = 'A valid email address is required.';
    if (!subject || subject.trim().length < 3) errors.subject = 'Subject is required (min 3 characters).';
    if (!message || message.trim().length < 10) errors.message = 'Message is required (min 10 characters).';
    if (!reason) errors.reason = 'Please select a reason for contacting.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    // Build submission record
    const submission = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      affiliation: (affiliation || '').trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      reason,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Persist to /tmp (ephemeral per-instance storage)
    const submissions = readSubmissions();
    submissions.push(submission);
    writeSubmissions(submissions);

    // Log to stdout (captured permanently in Vercel function logs)
    console.log('[CONTACT SUBMISSION]', JSON.stringify(submission));

    return res.status(200).json({
      success: true,
      message: 'Your message has been received. Antonio will get back to you soon.',
      id: submission.id,
    });
  } catch (err) {
    console.error('[CONTACT ERROR]', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};
