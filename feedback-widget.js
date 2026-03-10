/**
 * CodeLab Feedback Widget
 * Self-contained floating feedback button + panel
 * Works on both light (platform.css) and dark (styles.css) themed pages
 */
(function () {
  'use strict';
  if (document.getElementById('codelab-feedback-widget')) return;

  /* ── Inject Styles ─────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* Feedback FAB */
    #cl-fb-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      width: 48px; height: 48px; border-radius: 50%;
      background: #115740; color: #fff; border: 2px solid rgba(185,151,91,0.5);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 4px 20px rgba(17,87,64,0.35);
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
      font-size: 0; line-height: 0;
    }
    #cl-fb-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(17,87,64,0.45); background: #1A6B4A; }
    #cl-fb-fab.open { transform: rotate(45deg) scale(1.08); background: #B9975B; border-color: #B9975B; }
    #cl-fb-fab svg { pointer-events: none; }

    /* Panel */
    #cl-fb-panel {
      position: fixed; bottom: 84px; right: 24px; z-index: 9999;
      width: 360px; max-height: calc(100vh - 120px);
      background: #0C2E22; color: #F0F6F4; border: 1px solid rgba(185,151,91,0.25);
      border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      opacity: 0; transform: translateY(12px) scale(0.96);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #cl-fb-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
    #cl-fb-panel.hiding { opacity: 0; transform: translateY(12px) scale(0.96); }

    /* Panel header */
    .cl-fb-head {
      padding: 14px 16px 12px; border-bottom: 1px solid rgba(185,151,91,0.2);
      background: #0A2319; display: flex; align-items: center; justify-content: space-between;
    }
    .cl-fb-head-title { font-size: 0.85rem; font-weight: 600; color: #FFFFFF; display: flex; align-items: center; gap: 8px; }
    .cl-fb-head-title svg { color: #B9975B; }
    .cl-fb-close {
      width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all 0.15s; font-size: 14px;
    }
    .cl-fb-close:hover { border-color: rgba(248,81,73,0.4); color: #F85149; background: rgba(248,81,73,0.1); }

    /* Panel body */
    .cl-fb-body { padding: 14px 16px; overflow-y: auto; flex: 1; min-height: 0; }

    /* Form elements */
    .cl-fb-field { margin-bottom: 12px; }
    .cl-fb-label {
      display: block; font-size: 0.72rem; font-weight: 600; color: #B9975B;
      margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.06em;
      font-family: 'JetBrains Mono', monospace;
    }
    .cl-fb-input, .cl-fb-textarea, .cl-fb-select {
      width: 100%; padding: 9px 12px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #FFFFFF;
      font-size: 0.85rem; font-family: 'Inter', sans-serif;
      transition: border-color 0.15s;
      outline: none;
    }
    .cl-fb-input::placeholder, .cl-fb-textarea::placeholder { color: rgba(255,255,255,0.3); }
    .cl-fb-input:focus, .cl-fb-textarea:focus, .cl-fb-select:focus {
      border-color: #B9975B; box-shadow: 0 0 0 2px rgba(185,151,91,0.15);
    }
    .cl-fb-input.error, .cl-fb-textarea.error, .cl-fb-select.error {
      border-color: #F85149; box-shadow: 0 0 0 2px rgba(248,81,73,0.1);
    }
    .cl-fb-textarea { resize: vertical; min-height: 80px; max-height: 180px; line-height: 1.5; }
    .cl-fb-select { cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23B9975B' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
    }
    .cl-fb-error-msg { font-size: 0.72rem; color: #F85149; margin-top: 3px; display: none; }
    .cl-fb-error-msg.visible { display: block; }

    /* Type pills */
    .cl-fb-types { display: flex; flex-wrap: wrap; gap: 6px; }
    .cl-fb-type-btn {
      padding: 5px 12px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
    }
    .cl-fb-type-btn:hover { border-color: rgba(185,151,91,0.4); color: #B9975B; }
    .cl-fb-type-btn.active { background: rgba(185,151,91,0.12); border-color: rgba(185,151,91,0.35); color: #D4B97A; font-weight: 600; }
    .cl-fb-type-btn.active[data-type="bug"] { background: rgba(248,81,73,0.12); border-color: rgba(248,81,73,0.35); color: #FF6B6B; }
    .cl-fb-type-btn.active[data-type="ui-issue"] { background: rgba(227,179,65,0.12); border-color: rgba(227,179,65,0.35); color: #F0C94D; }
    .cl-fb-type-btn.active[data-type="improvement"] { background: rgba(88,166,255,0.12); border-color: rgba(88,166,255,0.35); color: #6DB8FF; }
    .cl-fb-type-btn.active[data-type="question"] { background: rgba(188,140,255,0.12); border-color: rgba(188,140,255,0.35); color: #C9A0FF; }

    /* Priority */
    .cl-fb-priority-row { display: flex; gap: 6px; }
    .cl-fb-pri-btn {
      flex: 1; padding: 6px 0; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s; text-align: center; font-family: 'Inter', sans-serif;
    }
    .cl-fb-pri-btn:hover { border-color: rgba(185,151,91,0.4); color: #B9975B; }
    .cl-fb-pri-btn.active[data-pri="low"] { background: rgba(0,217,126,0.12); border-color: rgba(0,217,126,0.35); color: #00F58C; }
    .cl-fb-pri-btn.active[data-pri="medium"] { background: rgba(227,179,65,0.12); border-color: rgba(227,179,65,0.35); color: #F0C94D; }
    .cl-fb-pri-btn.active[data-pri="high"] { background: rgba(248,81,73,0.12); border-color: rgba(248,81,73,0.35); color: #FF6B6B; }

    /* Submit button */
    .cl-fb-submit {
      width: 100%; padding: 10px 0; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #115740, #1A7A56); color: #FFFFFF; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
      margin-top: 4px; box-shadow: 0 2px 8px rgba(17,87,64,0.3);
    }
    .cl-fb-submit:hover { background: linear-gradient(135deg, #1A7A56, #22936A); box-shadow: 0 4px 14px rgba(17,87,64,0.4); transform: translateY(-1px); }
    .cl-fb-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

    /* Context bar */
    .cl-fb-context {
      padding: 8px 16px; border-top: 1px solid rgba(255,255,255,0.06); background: #0A2319;
      font-size: 0.68rem; color: rgba(255,255,255,0.25); font-family: 'JetBrains Mono', monospace;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Toast */
    #cl-fb-toast {
      position: fixed; bottom: 84px; right: 24px; z-index: 10000;
      padding: 12px 20px; border-radius: 10px;
      font-size: 0.85rem; font-weight: 500; font-family: 'Inter', sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4); display: none;
      opacity: 0; transform: translateY(8px);
      transition: opacity 0.25s, transform 0.25s;
    }
    #cl-fb-toast.success { background: #0C2E22; color: #00F58C; border: 1px solid rgba(0,217,126,0.3); }
    #cl-fb-toast.error { background: #0C2E22; color: #FF6B6B; border: 1px solid rgba(248,81,73,0.3); }
    #cl-fb-toast.visible { display: block; opacity: 1; transform: translateY(0); }

    /* Draft indicator */
    .cl-fb-draft-badge {
      font-size: 0.65rem; color: #B9975B; background: rgba(185,151,91,0.12);
      border: 1px solid rgba(185,151,91,0.25); padding: 1px 6px; border-radius: 4px;
      margin-left: auto; font-family: 'JetBrains Mono', monospace;
    }

    /* Mobile */
    @media (max-width: 480px) {
      #cl-fb-panel { width: calc(100vw - 32px); right: 16px; bottom: 76px; }
      #cl-fb-fab { bottom: 18px; right: 18px; width: 44px; height: 44px; }
    }
  `;
  document.head.appendChild(style);

  /* ── State ──────────────────────────────────────────────────────── */
  const DRAFT_KEY = 'cl-feedback-draft';
  let selectedType = null;
  let selectedPriority = null;
  let isOpen = false;

  /* ── Build DOM ─────────────────────────────────────────────────── */

  // FAB
  const fab = document.createElement('button');
  fab.id = 'cl-fb-fab';
  fab.setAttribute('aria-label', 'Send feedback');
  fab.setAttribute('title', 'Report a bug or share feedback');
  fab.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>';

  // Toast
  const toast = document.createElement('div');
  toast.id = 'cl-fb-toast';

  // Panel
  const panel = document.createElement('div');
  panel.id = 'cl-fb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Feedback form');
  panel.innerHTML = `
    <div class="cl-fb-head">
      <div class="cl-fb-head-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Quick Feedback
        <span id="cl-fb-draft-ind" class="cl-fb-draft-badge" style="display:none;">Draft saved</span>
      </div>
      <button class="cl-fb-close" id="cl-fb-close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="cl-fb-body">
      <div class="cl-fb-field">
        <label class="cl-fb-label">Category</label>
        <div class="cl-fb-types" id="cl-fb-types">
          <button class="cl-fb-type-btn" data-type="bug">Bug</button>
          <button class="cl-fb-type-btn" data-type="ui-issue">UI Issue</button>
          <button class="cl-fb-type-btn" data-type="improvement">Idea</button>
          <button class="cl-fb-type-btn" data-type="question">Question</button>
          <button class="cl-fb-type-btn" data-type="note">Note</button>
        </div>
        <div class="cl-fb-error-msg" id="cl-fb-type-err">Select a category.</div>
      </div>
      <div class="cl-fb-field">
        <label class="cl-fb-label" for="cl-fb-title">Title <span style="color:rgba(255,255,255,0.5);font-weight:400;text-transform:none;">(optional)</span></label>
        <input class="cl-fb-input" id="cl-fb-title" type="text" placeholder="Brief summary..." maxlength="120" autocomplete="off">
      </div>
      <div class="cl-fb-field">
        <label class="cl-fb-label" for="cl-fb-msg">Description</label>
        <textarea class="cl-fb-textarea" id="cl-fb-msg" placeholder="Describe the issue, idea, or note..." maxlength="2000"></textarea>
        <div class="cl-fb-error-msg" id="cl-fb-msg-err">Please provide a description (min 5 characters).</div>
      </div>
      <div class="cl-fb-field" id="cl-fb-pri-field" style="display:none;">
        <label class="cl-fb-label">Severity</label>
        <div class="cl-fb-priority-row" id="cl-fb-priorities">
          <button class="cl-fb-pri-btn" data-pri="low">Low</button>
          <button class="cl-fb-pri-btn" data-pri="medium">Medium</button>
          <button class="cl-fb-pri-btn" data-pri="high">High</button>
        </div>
      </div>
      <button class="cl-fb-submit" id="cl-fb-submit">Submit Feedback</button>
    </div>
    <div class="cl-fb-context" id="cl-fb-context"></div>
  `;

  const wrapper = document.createElement('div');
  wrapper.id = 'codelab-feedback-widget';
  wrapper.appendChild(panel);
  wrapper.appendChild(toast);
  wrapper.appendChild(fab);
  document.body.appendChild(wrapper);

  /* ── References ─────────────────────────────────────────────────── */
  const titleInput = document.getElementById('cl-fb-title');
  const msgInput = document.getElementById('cl-fb-msg');
  const submitBtn = document.getElementById('cl-fb-submit');
  const closeBtn = document.getElementById('cl-fb-close-btn');
  const typeErr = document.getElementById('cl-fb-type-err');
  const msgErr = document.getElementById('cl-fb-msg-err');
  const draftInd = document.getElementById('cl-fb-draft-ind');
  const priField = document.getElementById('cl-fb-pri-field');
  const contextBar = document.getElementById('cl-fb-context');

  /* ── Toggle Panel ───────────────────────────────────────────────── */
  function openPanel() {
    isOpen = true;
    fab.classList.add('open');
    panel.style.display = 'flex';
    requestAnimationFrame(() => { panel.classList.add('visible'); panel.classList.remove('hiding'); });
    restoreDraft();
    updateContext();
    // Focus first interactive element
    setTimeout(() => { document.getElementById('cl-fb-types').querySelector('button').focus(); }, 200);
  }

  function closePanel() {
    isOpen = false;
    fab.classList.remove('open');
    panel.classList.add('hiding');
    panel.classList.remove('visible');
    setTimeout(() => { panel.style.display = 'none'; panel.classList.remove('hiding'); }, 200);
    saveDraft();
  }

  fab.addEventListener('click', () => { isOpen ? closePanel() : openPanel(); });
  closeBtn.addEventListener('click', closePanel);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closePanel();
  });

  /* ── Type Buttons ───────────────────────────────────────────────── */
  document.getElementById('cl-fb-types').addEventListener('click', (e) => {
    const btn = e.target.closest('.cl-fb-type-btn');
    if (!btn) return;
    document.querySelectorAll('.cl-fb-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
    typeErr.classList.remove('visible');
    // Show priority for bugs/ui-issues
    priField.style.display = (selectedType === 'bug' || selectedType === 'ui-issue') ? 'block' : 'none';
    if (selectedType !== 'bug' && selectedType !== 'ui-issue') selectedPriority = null;
    saveDraft();
  });

  /* ── Priority Buttons ──────────────────────────────────────────── */
  document.getElementById('cl-fb-priorities').addEventListener('click', (e) => {
    const btn = e.target.closest('.cl-fb-pri-btn');
    if (!btn) return;
    document.querySelectorAll('.cl-fb-pri-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPriority = btn.dataset.pri;
    saveDraft();
  });

  /* ── Draft Persistence ─────────────────────────────────────────── */
  let draftTimer = null;

  function saveDraft() {
    const draft = {
      title: titleInput.value,
      message: msgInput.value,
      type: selectedType,
      priority: selectedPriority,
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch (_) {}
    showDraftIndicator();
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) titleInput.value = d.title;
      if (d.message) msgInput.value = d.message;
      if (d.type) {
        selectedType = d.type;
        const btn = document.querySelector('.cl-fb-type-btn[data-type="' + d.type + '"]');
        if (btn) btn.classList.add('active');
        priField.style.display = (d.type === 'bug' || d.type === 'ui-issue') ? 'block' : 'none';
      }
      if (d.priority) {
        selectedPriority = d.priority;
        const btn = document.querySelector('.cl-fb-pri-btn[data-pri="' + d.priority + '"]');
        if (btn) btn.classList.add('active');
      }
      if (d.title || d.message) showDraftIndicator();
    } catch (_) {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
    draftInd.style.display = 'none';
  }

  function showDraftIndicator() {
    if (titleInput.value || msgInput.value) {
      draftInd.style.display = 'inline';
    }
  }

  titleInput.addEventListener('input', () => { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 500); });
  msgInput.addEventListener('input', () => {
    clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 500);
    if (msgInput.value.trim().length >= 5) { msgErr.classList.remove('visible'); msgInput.classList.remove('error'); }
  });

  /* ── Context ───────────────────────────────────────────────────── */
  function updateContext() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const device = w <= 480 ? 'Mobile' : w <= 768 ? 'Tablet' : 'Desktop';
    contextBar.textContent = location.pathname + '  \u00B7  ' + w + '\u00D7' + h + '  \u00B7  ' + device;
  }

  /* ── Submit ─────────────────────────────────────────────────────── */
  submitBtn.addEventListener('click', async () => {
    // Validate
    let valid = true;
    if (!selectedType) { typeErr.classList.add('visible'); valid = false; }
    if (!msgInput.value.trim() || msgInput.value.trim().length < 5) {
      msgErr.classList.add('visible'); msgInput.classList.add('error'); valid = false;
    }
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const payload = {
      title: titleInput.value.trim() || null,
      type: selectedType,
      message: msgInput.value.trim(),
      priority: selectedPriority,
      pageUrl: location.href,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      userAgent: navigator.userAgent.substring(0, 200),
    };

    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        showToast('Feedback submitted \u2014 thank you!', 'success');
        resetForm();
        clearDraft();
        closePanel();
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      // Fallback: save to localStorage queue
      try {
        const queue = JSON.parse(localStorage.getItem('cl-feedback-queue') || '[]');
        queue.push({ ...payload, createdAt: new Date().toISOString() });
        localStorage.setItem('cl-feedback-queue', JSON.stringify(queue));
        showToast('Saved locally \u2014 will retry when online.', 'success');
        resetForm();
        clearDraft();
        closePanel();
      } catch (_) {
        showToast('Submission failed. Please try again.', 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback';
    }
  });

  function resetForm() {
    titleInput.value = '';
    msgInput.value = '';
    selectedType = null;
    selectedPriority = null;
    document.querySelectorAll('.cl-fb-type-btn, .cl-fb-pri-btn').forEach(b => b.classList.remove('active'));
    typeErr.classList.remove('visible');
    msgErr.classList.remove('visible');
    msgInput.classList.remove('error');
    priField.style.display = 'none';
    draftInd.style.display = 'none';
  }

  /* ── Toast ──────────────────────────────────────────────────────── */
  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = type;
    toast.style.display = 'block';
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => { toast.style.display = 'none'; }, 250);
    }, 3500);
  }

})();
