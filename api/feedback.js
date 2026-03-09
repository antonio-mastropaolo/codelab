// Vercel Serverless Function — Feedback / Bug Report Submissions
// Receives POST data, validates, logs, and stores in /tmp

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'feedback-submissions.json');

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

const VALID_TYPES = ['bug', 'ui-issue', 'improvement', 'question', 'note'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

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
    const { title, type, message, priority, pageUrl, viewport, userAgent } = req.body || {};

    // Validate
    const errors = {};
    if (!message || message.trim().length < 5) errors.message = 'Description is required (min 5 characters).';
    if (!type || !VALID_TYPES.includes(type)) errors.type = 'Please select a valid category.';
    if (priority && !VALID_PRIORITIES.includes(priority)) errors.priority = 'Invalid priority level.';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }

    const submission = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title: (title || '').trim() || null,
      type,
      message: message.trim(),
      priority: priority || null,
      pageUrl: pageUrl || null,
      viewport: viewport || null,
      userAgent: userAgent || null,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    // Persist to /tmp
    const submissions = readSubmissions();
    submissions.push(submission);
    writeSubmissions(submissions);

    // Log to stdout (permanent in Vercel logs)
    console.log('[FEEDBACK SUBMISSION]', JSON.stringify(submission));

    return res.status(200).json({
      success: true,
      message: 'Thanks for your feedback! It has been recorded.',
      id: submission.id,
    });
  } catch (err) {
    console.error('[FEEDBACK ERROR]', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};
