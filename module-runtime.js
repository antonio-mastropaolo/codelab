/**
 * ModuleRuntime — Shared navigation runtime for CodeLab modules
 * Replaces ~150 lines of duplicated JS per module page.
 *
 * Usage:
 *   ModuleRuntime.init({
 *     total: 30,
 *     slideInits: { 12: initMyDemo, 20: 'initOtherDemo' },
 *     hasFinish: true,      // default true
 *     hasAcronyms: true,    // default true
 *     onSlideChange: null   // optional callback(slideNum)
 *   });
 */
(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────────── */
  var cur = 1;
  var total = 1;
  var slideInits = {};
  var initsDone = {};
  var hasFinish = true;
  var hasAcronyms = true;
  var onSlideChange = null;
  var acrSeen = new Set();
  var moduleSlug = '';

  /* ── DOM cache ───────────────────────────────────────────────── */
  var $counter, $progress, $prev, $next, $dots, $finish;

  function cacheDom() {
    $counter  = document.getElementById('counter');
    $progress = document.getElementById('progress');
    $prev     = document.getElementById('prev-btn');
    $next     = document.getElementById('next-btn');
    $dots     = document.getElementById('dots');
    $finish   = document.getElementById('finish-overlay');
  }

  /* ── Dots ─────────────────────────────────────────────────────── */
  function buildDots() {
    if (!$dots) return;
    $dots.innerHTML = '';
    for (var i = 1; i <= total; i++) {
      var d = document.createElement('div');
      d.className = 'slide-dot' + (i === cur ? ' active' : '');
      d.onclick = (function (n) { return function () { setSlide(n); }; })(i);
      $dots.appendChild(d);
    }
  }

  /* ── Core navigation ──────────────────────────────────────────── */
  function setSlide(n) {
    var prev = document.getElementById('slide-' + cur);
    if (prev) prev.classList.remove('active');

    cur = Math.max(1, Math.min(total, n));

    var next = document.getElementById('slide-' + cur);
    if (next) next.classList.add('active');

    // Chrome
    if ($counter)  $counter.textContent = cur + ' / ' + total;
    if ($progress) $progress.style.width = (cur / total * 100).toFixed(2) + '%';
    if ($prev)     $prev.disabled = cur === 1;

    if (hasFinish) {
      if ($next) {
        $next.disabled = false;
        $next.textContent = cur === total ? '\u2713 Finish' : 'Next \u2192';
      }
    } else {
      if ($next) $next.disabled = cur === total;
    }

    buildDots();

    // Lazy init
    runSlideInit(cur);

    // Acronyms
    if (hasAcronyms) processAcronyms();

    // Progress tracking
    trackProgress(cur);

    // Module callback
    if (typeof onSlideChange === 'function') onSlideChange(cur);
  }

  function goSlide(d) {
    if (hasFinish && d === 1 && cur === total) { showFinish(); return; }
    setSlide(cur + d);
  }

  /* ── Keyboard ─────────────────────────────────────────────────── */
  function handleKey(e) {
    // Don't intercept if user is typing in an input/textarea
    var tag = (e.target || e.srcElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault(); goSlide(1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); goSlide(-1);
    }
  }

  /* ── Lazy slide init ──────────────────────────────────────────── */
  function runSlideInit(n) {
    if (initsDone[n]) return;
    var init = slideInits[n];
    if (!init) return;

    initsDone[n] = true;

    if (typeof init === 'function') {
      setTimeout(init, 50);
    } else if (typeof init === 'string' && typeof window[init] === 'function') {
      setTimeout(window[init], 50);
    }
  }

  /* ── Acronym tooltips ─────────────────────────────────────────── */
  function processAcronyms() {
    document.querySelectorAll('.slide.active .acr').forEach(function (el) {
      var key = el.textContent.trim();
      if (!acrSeen.has(key)) {
        acrSeen.add(key);
        el.classList.add('first-use');
        el.addEventListener('animationend', function () {
          el.classList.remove('first-use');
        }, { once: true });
      }
    });
  }

  /* ── Finish overlay ──────────────────────────────────────────── */
  function showFinish() {
    if ($finish) $finish.classList.add('visible');
  }
  function hideFinish() {
    if ($finish) $finish.classList.remove('visible');
  }
  function restartModule() {
    hideFinish();
    var prev = document.getElementById('slide-' + cur);
    if (prev) prev.classList.remove('active');
    cur = 1;
    document.getElementById('slide-1').classList.add('active');
    setSlide(1);
    window.scrollTo(0, 0);
  }

  /* ── Progress tracking (localStorage) ────────────────────────── */
  function deriveSlug() {
    var path = location.pathname.replace(/^\//, '').replace(/\.html$/, '');
    return path || 'index';
  }

  function trackProgress(slideNum) {
    if (!moduleSlug) return;
    try {
      var key = 'codelab-progress-' + moduleSlug;
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : { visited: [], total: total, lastSlide: 1, lastVisit: 0 };
      data.total = total;
      data.lastSlide = slideNum;
      data.lastVisit = Date.now();
      if (data.visited.indexOf(slideNum) === -1) {
        data.visited.push(slideNum);
        data.visited.sort(function (a, b) { return a - b; });
      }
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) { /* localStorage unavailable */ }
  }

  /* ── Public init ──────────────────────────────────────────────── */
  function init(config) {
    total         = config.total || 1;
    hasFinish     = config.hasFinish !== false;
    hasAcronyms   = config.hasAcronyms !== false;
    slideInits    = config.slideInits || {};
    onSlideChange = config.onSlideChange || null;
    moduleSlug    = deriveSlug();

    cacheDom();
    document.addEventListener('keydown', handleKey);

    // Button handlers
    if ($prev) $prev.addEventListener('click', function () { goSlide(-1); });
    if ($next) $next.addEventListener('click', function () { goSlide(1); });

    // Resume from hash (e.g. #slide=5) or start at 1
    var startSlide = 1;
    var hashMatch = location.hash.match(/slide=(\d+)/);
    if (hashMatch) {
      startSlide = Math.max(1, Math.min(total, parseInt(hashMatch[1], 10)));
    }

    // Initial state
    if (startSlide > 1) {
      var s1 = document.getElementById('slide-1');
      if (s1) s1.classList.remove('active');
    }
    setSlide(startSlide);
  }

  /* ── Register extra inits after init() ───────────────────────── */
  function registerSlideInit(slideNum, fn) {
    slideInits[slideNum] = fn;
  }

  /* ── Expose API ──────────────────────────────────────────────── */
  window.ModuleRuntime = {
    init: init,
    setSlide: setSlide,
    goSlide: goSlide,
    showFinish: showFinish,
    hideFinish: hideFinish,
    restartModule: restartModule,
    registerSlideInit: registerSlideInit,
    get current() { return cur; },
    set current(v) { cur = v; }
  };

  // Globals for onclick handlers in HTML
  window.setSlide       = setSlide;
  window.goSlide        = goSlide;
  window.showFinish     = showFinish;
  window.hideFinish     = hideFinish;
  window.restartModule  = restartModule;
})();
