// ============================================================
// ВСТРОЕННЫЙ ЗВУКОВОЙ ДВИЖОК (без отдельного файла)
// ============================================================
var SoundEngine = (function () {
  let ctx = null;
  let unlocked = false;
  let lastResult = 'ещё не играло';

  function log() {
    try { console.log.apply(console, ['[Sound]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  function getCtx() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { log('AudioContext не поддерживается'); return null; }
        ctx = new AC();
        log('создан, состояние:', ctx.state);
      } catch (e) {
        log('ошибка создания:', e);
        return null;
      }
    }
    return ctx;
  }

  function unlock() {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'running') { unlocked = true; return; }
    c.resume().then(function () {
      if (c.state === 'running') unlocked = true;
      log('unlock → состояние:', c.state);
    }).catch(function (e) {
      log('unlock ошибка:', e);
    });
  }

  function ensureRunning(callback) {
    const c = getCtx();
    if (!c) { callback(null); return; }
    if (c.state === 'running') { callback(c); return; }
    c.resume().then(function () {
      callback(c.state === 'running' ? c : null);
    }).catch(function (e) {
      log('resume ошибка:', e);
      callback(null);
    });
  }

  function playNote(c, n) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = n.type || 'sine';
    osc.frequency.value = n.freq;
    const now = c.currentTime + 0.02 + n.start;
    const end = now + n.dur;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(n.gain, now + 0.012);
    g.gain.setValueAtTime(n.gain, end - 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(now);
    osc.stop(end + 0.05);
  }

  // Резервный путь: WAV-data-URI через <audio>
  function buildWav(notes) {
    const sr = 22050;
    let total = 0;
    notes.forEach(function (n) { if (n.start + n.dur > total) total = n.start + n.dur; });
    const numSamples = Math.floor(sr * total);
    const buf = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buf);
    function writeStr(off, s) { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    writeStr(36, 'data'); view.setUint32(40, numSamples * 2, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sr;
      let s = 0;
      notes.forEach(function (n) {
        if (t >= n.start && t < n.start + n.dur) {
          const nt = t - n.start;
          const env = Math.min(1, Math.min(nt / 0.012, (n.dur - nt) / 0.03));
          s += Math.sin(2 * Math.PI * n.freq * nt) * env * n.gain;
        }
      });
      s = Math.max(-1, Math.min(1, s * 0.7));
      view.setInt16(44 + i * 2, s * 32767, true);
    }
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return 'data:audio/wav;base64,' + btoa(bin);
  }

  function playFallback(notes) {
    try {
      const audio = new Audio(buildWav(notes));
      audio.volume = 0.7;
      const p = audio.play();
      if (p && p.then) {
        p.then(function () { lastResult = 'fallback OK'; log('fallback воспроизводится'); })
         .catch(function (e) { lastResult = 'fallback FAIL: ' + e; log('fallback ошибка:', e); });
      }
    } catch (e) {
      lastResult = 'fallback error: ' + e;
      log('fallback build error:', e);
    }
  }

  function play(notes) {
    ensureRunning(function (c) {
      if (!c) { log('AudioContext не running → fallback'); playFallback(notes); return; }
      try {
        notes.forEach(function (n) { playNote(c, n); });
        lastResult = 'Web Audio OK (state=' + c.state + ')';
        log('ноты запланированы');
      } catch (e) {
        lastResult = 'Web Audio error: ' + e;
        log('schedule error:', e);
        playFallback(notes);
      }
    });
  }

  return {
    unlock: unlock,
    diagnose: function () {
      const c = getCtx();
      return {
        hasAC: !!c,
        state: c ? c.state : 'none',
        sampleRate: c ? c.sampleRate : 0,
        lastResult: lastResult
      };
    },
    playCorrect: function () {
      log('playCorrect');
      play([
        { freq: 523.25, start: 0.00, dur: 0.15, gain: 0.7 }, // C5
        { freq: 659.25, start: 0.10, dur: 0.15, gain: 0.7 }, // E5
        { freq: 783.99, start: 0.20, dur: 0.15, gain: 0.8 }, // G5
        { freq: 1046.50, start: 0.30, dur: 0.50, gain: 1.0 } // C6
      ]);
    },
    playWrong: function () {
      log('playWrong');
      play([
        { freq: 220.00, start: 0.00, dur: 0.25, gain: 0.8 }, // A3
        { freq: 164.81, start: 0.20, dur: 0.30, gain: 0.9 }, // E3
        { freq: 130.81, start: 0.45, dur: 0.50, gain: 1.0 }  // C3
      ]);
    },
    playFinish: function () {
      log('playFinish');
      play([
        { freq: 523.25, start: 0.00, dur: 0.12, gain: 0.7 },
        { freq: 659.25, start: 0.13, dur: 0.12, gain: 0.7 },
        { freq: 783.99, start: 0.26, dur: 0.12, gain: 0.7 },
        { freq: 1046.50, start: 0.39, dur: 0.20, gain: 1.0 },
        { freq: 1318.51, start: 0.62, dur: 0.50, gain: 0.9 }
      ]);
    },
    playMicOn: function () {
      log('playMicOn');
      play([
        { freq: 880.00, start: 0.00, dur: 0.07, gain: 0.6 },
        { freq: 1174.66, start: 0.08, dur: 0.10, gain: 0.6 }
      ]);
    }
  };
})();

// ============================================================
// ОСНОВНАЯ ЛОГИКА
// ============================================================
let settings = Storage1000.loadSettings();
let progress = Storage1000.loadProgress();

// Тема
function applyTheme() {
  document.documentElement.setAttribute('data-theme', settings.theme);
}
applyTheme();

// Голоса
let voices = [];
(async function initVoices() {
  voices = await Speech1000.loadVoices();
  const v = Speech1000.pickBestVoice(voices, settings.voiceURI);
  if (v) {
    Speech1000.setVoice(v);
    settings.voiceURI = v.voiceURI;
    Storage1000.saveSettings(settings);
  }
})();

// Разблокировка звука на первом же взаимодействии
(function setupUnlock() {
  function unlock() {
    try { SoundEngine.unlock(); } catch (e) { console.warn('[Sound] unlock failed', e); }
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
    document.removeEventListener('keydown', unlock);
  }
  document.addEventListener('click', unlock);
  document.addEventListener('touchstart', unlock);
  document.addEventListener('keydown', unlock);
})();

// Обёртки с логированием и задержкой, чтобы избежать конфликта с озвучкой
function playFeedback(ok) {
  console.log('[Sound] playFeedback, ok=', ok, 'enabled=', settings.soundsEnabled);
  if (settings.soundsEnabled === false) return;
  // останавливаем текущую озвучку — чтобы она не заглушила звук
  try { window.speechSynthesis.cancel(); } catch (e) {}
  // вибрация как запасной вариант (на телефоне)
  try {
    if (navigator.vibrate) navigator.vibrate(ok ? [60, 40, 60] : 200);
  } catch (e) {}
  // небольшая пауза — дать аудиосессии освободиться после распознавания
  setTimeout(function () {
    try {
      if (ok) SoundEngine.playCorrect();
      else SoundEngine.playWrong();
    } catch (e) {
      console.error('[Sound] play failed', e);
    }
  }, 120);
}
function soundFinish() {
  console.log('[Sound] soundFinish');
  if (settings.soundsEnabled === false) return;
  try { SoundEngine.playFinish(); } catch (e) { console.error(e); }
}
function soundMicOn() {
  console.log('[Sound] soundMicOn');
  if (settings.soundsEnabled === false) return;
  try { SoundEngine.unlock(); SoundEngine.playMicOn(); } catch (e) { console.error(e); }
}

// Toast
function toast(msg) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 1800);
  setTimeout(() => el.remove(), 2200);
}

// Навигация
const ROUTES = ['home', 'learn', 'review', 'train', 'catalog', 'favorites', 'stats', 'settings', 'help', 'session'];

function navigate(route) {
  if (!ROUTES.includes(route)) route = 'home';
  location.hash = '#' + route;
}

function applyRoute() {
  const route = (location.hash || '#home').replace('#', '') || 'home';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + route);
  if (view) view.classList.add('active');
  document.querySelectorAll('.nav a, .mobile-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
  if (route === 'home') renderHome();
  if (route === 'learn') renderLearn();
  if (route === 'review') renderReview();
  if (route === 'train') renderTrain();
  if (route === 'catalog') renderCatalog();
  if (route === 'favorites') renderFavorites();
  if (route === 'stats') renderStats();
  if (route === 'settings') renderSettings();
  if (route === 'help') renderHelp();
  if (route === 'session') renderSession();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', applyRoute);

// Хелперы
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function phraseById(id) { return PHRASES.find(p => p.id === id); }

function statusBadge(ps) {
  const st = Storage1000.phraseStatus(ps);
  const label = Storage1000.phraseStatusLabel(st);
  const color = Storage1000.phraseStatusColor(st);
  const span = el('span', { class: 'chip' });
  span.innerHTML = `<span class="status-dot" style="background:${color}"></span>${label}`;
  return span;
}

// HOME
function renderHome() {
  const root = document.getElementById('view-home');
  const streak = Storage1000.currentStreak(progress);
  const learned = Storage1000.learnedCount(progress);
  const mastered = Storage1000.masteredCount(progress);
  const due = Storage1000.duePhrases(progress).length;
  const newIds = Storage1000.newPhrasesIds(progress, settings.phrasesPerDay);
  const total = PHRASES.length;

  root.innerHTML = '';
  const greet = el('div', { class: 'card' });
  greet.innerHTML = `
    <h2>С возвращением! 👋</h2>
    <p class="muted">Серия: <b>${streak}</b> дн. подряд · Изучено: <b>${learned}</b> из ${total}</p>
  `;
  root.appendChild(greet);

  const grid = el('div', { class: 'grid-3' });
  grid.appendChild(statCard('📚', 'Новых на сегодня', newIds.length + ' / ' + settings.phrasesPerDay));
  grid.appendChild(statCard('🔁', 'Пора повторить', String(due)));
  grid.appendChild(statCard('🏆', 'Закреплено', mastered + ' / ' + total));
  root.appendChild(grid);

  const prog = el('div', { class: 'card' });
  const pct = Math.round(learned / total * 100);
  prog.innerHTML = `
    <div class="row between">
      <h3 style="margin:0">Общий прогресс</h3>
      <span class="muted">${pct}%</span>
    </div>
    <div class="progress" style="margin-top:10px"><i style="width:${pct}%"></i></div>
    <div class="row" style="margin-top:16px">
      <button class="btn primary big" id="home-continue">▶ Продолжить обучение</button>
      <button class="btn" id="home-review">🔁 Повторить (${due})</button>
    </div>
  `;
  root.appendChild(prog);
  prog.querySelector('#home-continue').onclick = () => {
    const ids = newIds.length ? newIds : Storage1000.duePhrases(progress).slice(0, settings.phrasesPerDay);
    startSession(ids, 'daily');
  };
  prog.querySelector('#home-review').onclick = () => navigate('review');

  const topicsCard = el('div', { class: 'card' });
  topicsCard.innerHTML = '<h3>Темы</h3>';
  const tg = el('div', { class: 'grid-3' });
  Object.entries(TOPICS).forEach(([key, t]) => {
    const card = el('div', { class: 'topic-card' });
    const totalT = PHRASES.filter(p => p.topic === key).length;
    const learnedT = PHRASES.filter(p => p.topic === key && progress.phrases[p.id] && progress.phrases[p.id].successes >= 3).length;
    card.innerHTML = `
      <div class="icon">${t.icon}</div>
      <div class="name">${t.name}</div>
      <div class="meta">${learnedT} / ${totalT}</div>
      <div class="progress"><i style="width:${Math.round(learnedT/totalT*100)}%"></i></div>
    `;
    card.onclick = () => {
      const ids = PHRASES.filter(p => p.topic === key).map(p => p.id);
      startSession(ids, 'topic:' + key);
    };
    tg.appendChild(card);
  });
  topicsCard.appendChild(tg);
  root.appendChild(topicsCard);
}

function statCard(icon, label, value) {
  const c = el('div', { class: 'card' });
  c.innerHTML = `<div class="stat"><div class="muted small">${icon} ${label}</div><div class="value">${value}</div></div>`;
  return c;
}

// LEARN
let learnTab = 'days';
let learnDay = 1;

function renderLearn() {
  const root = document.getElementById('view-learn');
  root.innerHTML = `
    <div class="card">
      <div class="row between">
        <h2 style="margin:0">Учить</h2>
        <div class="row">
          <button class="btn ${learnTab==='days'?'primary':''}" id="tab-days">По дням</button>
          <button class="btn ${learnTab==='topics'?'primary':''}" id="tab-topics">По темам</button>
        </div>
      </div>
    </div>
  `;
  root.querySelector('#tab-days').onclick = () => { learnTab = 'days'; renderLearn(); };
  root.querySelector('#tab-topics').onclick = () => { learnTab = 'topics'; renderLearn(); };

  if (learnTab === 'days') {
    const card = el('div', { class: 'card' });
    card.innerHTML = `<h3>100 дней по 10 фраз</h3>
      <div class="row" style="margin:12px 0">
        <select id="day-select">
          ${Array.from({length:100}, (_,i)=>`<option value="${i+1}" ${learnDay===i+1?'selected':''}>День ${i+1}: фразы ${i*10+1}–${i*10+10}</option>`).join('')}
        </select>
        <button class="btn primary" id="start-day">Начать день</button>
      </div>
      <p class="muted small">Каждый день — 10 новых фраз. Так вы пройдёте все 1000 фраз за 100 дней.</p>`;
    root.appendChild(card);
    card.querySelector('#day-select').onchange = (e) => { learnDay = Number(e.target.value); };
    card.querySelector('#start-day').onclick = () => {
      const ids = [];
      const start = (learnDay - 1) * 10 + 1;
      for (let i = 0; i < 10; i++) ids.push(start + i);
      startSession(ids, 'day:' + learnDay);
    };
  } else {
    const card = el('div', { class: 'card' });
    card.innerHTML = '<h3>Темы</h3>';
    const grid = el('div', { class: 'grid-3' });
    Object.entries(TOPICS).forEach(([key, t]) => {
      const totalT = PHRASES.filter(p => p.topic === key).length;
      const learnedT = PHRASES.filter(p => p.topic === key && progress.phrases[p.id] && progress.phrases[p.id].successes >= 3).length;
      const c = el('div', { class: 'topic-card' });
      c.innerHTML = `
        <div class="icon">${t.icon}</div>
        <div class="name">${t.name}</div>
        <div class="meta">${learnedT} / ${totalT}</div>
        <div class="progress"><i style="width:${Math.round(learnedT/totalT*100)}%"></i></div>
      `;
      c.onclick = () => {
        const ids = PHRASES.filter(p => p.topic === key).map(p => p.id);
        startSession(ids, 'topic:' + key);
      };
      grid.appendChild(c);
    });
    card.appendChild(grid);
    root.appendChild(card);
  }
}

// REVIEW
function renderReview() {
  const root = document.getElementById('view-review');
  const due = Storage1000.duePhrases(progress);
  root.innerHTML = '';
  const card = el('div', { class: 'card' });
  if (!due.length) {
    card.innerHTML = `<div class="empty"><div class="big">✨</div>
      <div>Пока нечего повторять — возвращайтесь позже.</div>
      <div class="muted small" style="margin-top:8px">Новые фразы появятся здесь по системе интервального повторения: 1 → 3 → 7 → 14 → 30 дней.</div>
    </div>`;
  } else {
    card.innerHTML = `<h2>Повторение</h2>
      <p class="muted">Пора повторить ${due.length} фраз(ы).</p>
      <button class="btn primary big" id="start-review">▶ Начать повторение</button>`;
    card.querySelector('#start-review').onclick = () => startSession(due, 'review');
  }
  root.appendChild(card);
}

// TRAIN
function renderTrain() {
  const root = document.getElementById('view-train');
  const modes = [
    { id: 'listen', icon: '👂', name: 'Слушай и повторяй', desc: 'Звучит фраза — вы повторяете' },
    { id: 'translate', icon: '🇷🇺→🇬🇧', name: 'Перевод → английский', desc: 'Показан перевод — произнесите фразу по-английски' },
    { id: 'audio', icon: '🙈', name: 'Аудио без текста', desc: 'Слышите фразу, не видите её' },
    { id: 'topic-test', icon: '🎯', name: 'Тест по теме', desc: '10–20 случайных фраз из темы' },
    { id: 'marathon', icon: '🏃', name: 'Марафон', desc: 'Непрерывная серия из изученных фраз' }
  ];
  root.innerHTML = '';
  const card = el('div', { class: 'card' });
  card.innerHTML = '<h2>Тренировка</h2><p class="muted">Выберите режим.</p>';
  const grid = el('div', { class: 'grid-2' });
  modes.forEach(m => {
    const t = el('div', { class: 'mode-tile' });
    t.innerHTML = `<div class="icon">${m.icon}</div><div class="name">${m.name}</div><div class="desc">${m.desc}</div>`;
    t.onclick = () => startTrainMode(m.id);
    grid.appendChild(t);
  });
  card.appendChild(grid);
  root.appendChild(card);
}

function startTrainMode(mode) {
  if (mode === 'topic-test') {
    const key = prompt('Введите тему: ' + Object.keys(TOPICS).join(', '), 'greetings');
    if (!key || !TOPICS[key]) { toast('Тема не найдена'); return; }
    const ids = PHRASES.filter(p => p.topic === key).map(p => p.id).sort(() => Math.random() - 0.5).slice(0, 15);
    startSession(ids, 'test:' + key, { mode: 'test' });
    return;
  }
  if (mode === 'marathon') {
    const ids = PHRASES.filter(p => progress.phrases[p.id] && progress.phrases[p.id].successes >= 3).map(p => p.id);
    if (!ids.length) { toast('Сначала выучите хотя бы несколько фраз'); return; }
    startSession(ids.sort(() => Math.random() - 0.5), 'marathon', { mode: 'marathon' });
    return;
  }
  const ids = PHRASES.filter(p => !progress.phrases[p.id] || progress.phrases[p.id].successes < 3).map(p => p.id).slice(0, 20);
  if (!ids.length) { toast('Все фразы уже изучены — перейдите в повторение'); return; }
  startSession(ids, 'train:' + mode, { mode });
}

// SESSION
let session = null;

function startSession(ids, tag, opts = {}) {
  const list = ids.filter(id => phraseById(id));
  if (!list.length) { toast('Нет фраз для занятия'); return; }
  session = {
    ids: list,
    index: 0,
    tag,
    opts,
    startedAt: Date.now(),
    correct: 0,
    total: 0,
    _attempted: new Set()
  };
  navigate('session');
  renderSession();
}

function renderSession() {
  let view = document.getElementById('view-session');
  if (!view) {
    view = document.createElement('div');
    view.id = 'view-session';
    view.className = 'view';
    document.querySelector('.main').appendChild(view);
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  view.classList.add('active');

  if (!session) { view.innerHTML = ''; return; }

  const id = session.ids[session.index];
  const phrase = phraseById(id);
  const ps = Storage1000.getPhraseState(progress, id);

  const hideText = session.opts.mode === 'audio';
  const showRu = session.opts.mode === 'translate';

  view.innerHTML = `
    <div class="card" style="margin-bottom:14px">
      <div class="row between">
        <div class="row">
          <button class="btn" id="s-back">← Назад</button>
          <span class="muted">${session.index + 1} / ${session.ids.length}</span>
        </div>
        <div class="row">
          <span class="muted small">${TOPICS[phrase.topic].icon} ${TOPICS[phrase.topic].name}</span>
          <button class="btn" id="s-skip">Пропустить →</button>
        </div>
      </div>
    </div>

    <div class="card phrase-card" id="phrase-card">
      ${showRu ? `<div class="phrase-ru">${phrase.ru}</div>` : ''}
      ${hideText ? `<div class="muted">Аудио без текста — произнесите фразу после прослушивания</div>` : `<div class="phrase-en" id="phrase-en">${phrase.en}</div>`}
      ${settings.showTranscription && !hideText ? `<div class="phrase-tr">${phrase.transcription}</div>` : ''}
      ${settings.showTranslation && !hideText && !showRu ? `<div class="phrase-ru">${phrase.ru}</div>` : ''}
      <div class="phrase-words" id="phrase-words"></div>
      <div class="controls" style="margin-top:8px">
        <button class="btn primary" id="s-listen">🔊 Послушать</button>
        <button class="btn" id="s-slow">🐢 Медленно</button>
        <button class="btn ghost" id="s-fav">${ps.favorite ? '★ В избранном' : '☆ В избранное'}</button>
        <button class="btn ghost" id="s-diff">${ps.difficult ? '⚑ Сложная' : '⚐ Отметить сложной'}</button>
        ${hideText ? `<button class="btn" id="s-reveal">👁 Показать текст</button>` : ''}
      </div>
      <div class="mic-wrap" style="margin-top:10px">
        <button class="mic-btn" id="s-mic" title="Пробел — запись">🎤</button>
        <div class="muted small" id="s-status">Нажмите микрофон и произнесите фразу</div>
      </div>
      <div id="s-result"></div>
    </div>

    <div class="card">
      <div class="row between">
        <div class="row">
          <span class="muted small">Статус:</span>
          <span id="s-badge"></span>
        </div>
        <div class="row">
          <button class="btn" id="s-again">🔁 Ещё раз</button>
          <button class="btn" id="s-later">⏰ Позже</button>
          <button class="btn primary" id="s-learned">✅ Запомнил</button>
        </div>
      </div>
    </div>
  `;

  view.querySelector('#s-badge').appendChild(statusBadge(ps));

  const enEl = view.querySelector('#phrase-en');
  if (enEl) enEl.textContent = phrase.en;

  view.querySelector('#s-listen').onclick = () => Speech1000.speak(phrase.en, { rate: settings.rate });
  view.querySelector('#s-slow').onclick = () => Speech1000.speak(phrase.en, { rate: 0.65 });
  view.querySelector('#s-fav').onclick = () => {
    ps.favorite = !ps.favorite; Storage1000.saveProgress(progress);
    toast(ps.favorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    renderSession();
  };
  view.querySelector('#s-diff').onclick = () => {
    ps.difficult = !ps.difficult; Storage1000.saveProgress(progress);
    toast(ps.difficult ? 'Отмечено как сложная' : 'Снята отметка «сложная»');
    renderSession();
  };
  const revealBtn = view.querySelector('#s-reveal');
  if (revealBtn) revealBtn.onclick = () => {
    view.querySelector('#phrase-card').querySelector('div[class="muted"]')?.remove();
    const d = document.createElement('div');
    d.className = 'phrase-en';
    d.id = 'phrase-en';
    d.textContent = phrase.en;
    view.querySelector('#phrase-card').insertBefore(d, view.querySelector('#phrase-words'));
    revealBtn.remove();
  };
  view.querySelector('#s-back').onclick = () => {
    if (session.index > 0) { session.index--; renderSession(); }
    else { navigate('home'); }
  };
  view.querySelector('#s-skip').onclick = () => {
    session.index++;
    if (session.index >= session.ids.length) finishSession();
    else renderSession();
  };

  view.querySelector('#s-learned').onclick = () => {
    const attempted = session._attempted && session._attempted.has(id);
    if (!attempted) {
      Storage1000.recordAttempt(progress, id, true, 100);
      session._attempted.add(id);
      updateStreakToast();
    }
    nextPhrase();
  };

  view.querySelector('#s-again').onclick = () => {
    session._attempted.delete(id);
    const box = view.querySelector('#s-result');
    if (box) box.innerHTML = '';
    Speech1000.speak(phrase.en, { rate: settings.rate });
  };

  view.querySelector('#s-later').onclick = () => {
    const attempted = session._attempted && session._attempted.has(id);
    if (!attempted) {
      Storage1000.recordAttempt(progress, id, false, 0);
      session._attempted.add(id);
    }
    const ps2 = Storage1000.getPhraseState(progress, id);
    ps2.nextReview = Date.now() + 24 * 3600 * 1000;
    Storage1000.saveProgress(progress);
    toast('Добавлено в повторение');
    nextPhrase();
  };

  // Микрофон
  let recording = false;
  const micBtn = view.querySelector('#s-mic');
  const statusEl = view.querySelector('#s-status');
  micBtn.onclick = () => {
    if (!Speech1000.recognitionAvailable) {
      toast('Распознавание речи недоступно в этом браузере. Используйте Chrome или Edge.');
      return;
    }
    if (recording) { Speech1000.stopListening(); return; }
    soundMicOn();
    recording = true;
    micBtn.classList.add('rec');
    statusEl.textContent = 'Слушаю...';
    const started = Date.now();
    Speech1000.listenOnce({
      onResult: (alts) => {
        const spoken = alts[0] || '';
        const { score, words } = Speech1000.matchPhrase(phrase.en, spoken);
        const ok = score >= settings.threshold;
        Storage1000.recordAttempt(progress, id, ok, Math.round(score * 100));
        session._attempted.add(id);
        Storage1000.addTime(progress, Math.round((Date.now() - started) / 1000));
        showResult({ score, words, spoken }, ok);
        view.querySelector('#s-badge').innerHTML = '';
        view.querySelector('#s-badge').appendChild(statusBadge(Storage1000.getPhraseState(progress, id)));
      },
      onError: (err) => {
        statusEl.textContent = 'Ошибка: ' + err;
        toast('Не удалось распознать. Проверьте микрофон и разрешение.');
      },
      onEnd: () => {
        recording = false;
        micBtn.classList.remove('rec');
      }
    });
  };

  // Горячие клавиши
  if (window._sessionKeyHandler) document.removeEventListener('keydown', window._sessionKeyHandler);
  window._sessionKeyHandler = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); micBtn.click(); }
    else if (e.key === 'ArrowRight') { view.querySelector('#s-learned').click(); }
    else if (e.key === 'ArrowLeft') { view.querySelector('#s-back').click(); }
  };
  document.addEventListener('keydown', window._sessionKeyHandler);

  // Автопроизношение новой фразы
  const noAutoSpeak = session.opts.mode === 'translate' || session.opts.mode === 'test';
  if (!noAutoSpeak && settings.autoSpeak !== false) {
    const phraseIdForSpeak = id;
    setTimeout(() => {
      if (!session) return;
      if (session.ids[session.index] !== phraseIdForSpeak) return;
      const viewEl = document.getElementById('view-session');
      if (!viewEl || !viewEl.classList.contains('active')) return;
      Speech1000.speak(phrase.en, { rate: settings.rate });
    }, 500);
  }
}

function nextPhrase() {
  session.index++;
  if (session.index >= session.ids.length) finishSession();
  else renderSession();
}

function showResult({ score, words, spoken }, ok) {
  // 🔊 Звук правильного/неправильного ответа
  playFeedback(ok);

  const view = document.getElementById('view-session');
  const box = view.querySelector('#s-result');
  if (!box) return;
  const pct = Math.round(score * 100);
  box.innerHTML = `
    <div class="result ${ok ? 'ok' : 'bad'}">
      <div class="score">${pct}% ${ok ? '✅' : '❌'}</div>
      <div class="heard">Услышано: "${spoken || '—'}"</div>
      <div class="phrase-words" id="s-words"></div>
    </div>
  `;
  const wc = box.querySelector('#s-words');
  (words || []).forEach(w => {
    const s = document.createElement('span');
    s.className = 'word ' + (w.ok ? 'ok' : 'bad');
    s.textContent = w.text;
    wc.appendChild(s);
  });
}

function updateStreakToast() {
  const s = Storage1000.currentStreak(progress);
  if (s > 1) toast('🔥 Серия: ' + s + ' дней подряд!');
}

function finishSession() {
  if (!session) return;
  soundFinish();
  const total = session.ids.length;
  const time = Math.round((Date.now() - session.startedAt) / 1000);
  Storage1000.addTime(progress, time);
  const view = document.getElementById('view-session');
  view.innerHTML = `
    <div class="card">
      <h2>Отличная работа! 🎉</h2>
      <p class="muted">Фраз в сессии: ${total}. Время: ${time} сек.</p>
      <div class="row" style="margin-top:16px">
        <button class="btn primary" id="finish-home">На главную</button>
        <button class="btn" id="finish-again">Ещё раз</button>
      </div>
    </div>
  `;
  view.querySelector('#finish-home').onclick = () => { session = null; navigate('home'); };
  view.querySelector('#finish-again').onclick = () => {
    const ids = session.ids.slice();
    session = null;
    startSession(ids, 'again');
  };
  if (window._sessionKeyHandler) { document.removeEventListener('keydown', window._sessionKeyHandler); window._sessionKeyHandler = null; }
}

// CATALOG
let catalogQuery = '';
let catalogTopic = 'all';
let catalogStatus = 'all';

function renderCatalog() {
  const root = document.getElementById('view-catalog');
  root.innerHTML = `
    <div class="card">
      <h2>Каталог фраз</h2>
      <div class="row" style="margin:12px 0">
        <input class="input" id="cat-q" placeholder="Поиск по фразе или переводу..." value="${catalogQuery}" style="flex:1;min-width:200px">
        <select id="cat-topic" style="max-width:260px">
          <option value="all">Все темы</option>
          ${Object.entries(TOPICS).map(([k,t])=>`<option value="${k}" ${catalogTopic===k?'selected':''}>${t.icon} ${t.name}</option>`).join('')}
        </select>
        <select id="cat-status" style="max-width:180px">
          <option value="all" ${catalogStatus==='all'?'selected':''}>Все статусы</option>
          <option value="new" ${catalogStatus==='new'?'selected':''}>Новые</option>
          <option value="learning" ${catalogStatus==='learning'?'selected':''}>Изучаю</option>
          <option value="learned" ${catalogStatus==='learned'?'selected':''}>Выучены</option>
          <option value="mastered" ${catalogStatus==='mastered'?'selected':''}>Закреплены</option>
        </select>
      </div>
      <div id="cat-count" class="muted small" style="margin-bottom:8px"></div>
      <div class="list" id="cat-list"></div>
    </div>
  `;
  const q = root.querySelector('#cat-q');
  q.oninput = () => { catalogQuery = q.value; renderCatalogList(); };
  root.querySelector('#cat-topic').onchange = (e) => { catalogTopic = e.target.value; renderCatalogList(); };
  root.querySelector('#cat-status').onchange = (e) => { catalogStatus = e.target.value; renderCatalogList(); };
  renderCatalogList();
}

function renderCatalogList() {
  const list = document.getElementById('cat-list');
  if (!list) return;
  const q = catalogQuery.toLowerCase().trim();
  const filtered = PHRASES.filter(p => {
    if (catalogTopic !== 'all' && p.topic !== catalogTopic) return false;
    if (q && !(p.en.toLowerCase().includes(q) || p.ru.toLowerCase().includes(q))) return false;
    const ps = Storage1000.getPhraseState(progress, p.id);
    if (catalogStatus !== 'all') {
      const st = Storage1000.phraseStatus(ps);
      if (st !== catalogStatus) return false;
    }
    return true;
  });
  document.getElementById('cat-count').textContent = 'Найдено: ' + filtered.length + ' из ' + PHRASES.length;
  list.innerHTML = '';
  filtered.slice(0, 400).forEach(p => {
    const item = el('div', { class: 'list-item' });
    item.innerHTML = `
      <div class="num">${p.id}</div>
      <div class="body">
        <div class="en">${p.en}</div>
        ${settings.showTranscription ? `<div class="tr">${p.transcription}</div>` : ''}
        ${settings.showTranslation ? `<div class="ru">${p.ru}</div>` : ''}
      </div>
      <div class="actions">
        <button class="btn" title="Прослушать">🔊</button>
        <button class="btn" title="Учить">▶</button>
      </div>
    `;
    item.querySelector('.actions button:nth-child(1)').onclick = () => Speech1000.speak(p.en, { rate: settings.rate });
    item.querySelector('.actions button:nth-child(2)').onclick = () => startSession([p.id], 'catalog');
    list.appendChild(item);
  });
}

// FAVORITES
function renderFavorites() {
  const root = document.getElementById('view-favorites');
  const favIds = [], diffIds = [];
  for (const id in progress.phrases) {
    const ps = progress.phrases[id];
    if (ps.favorite) favIds.push(Number(id));
    if (ps.difficult) diffIds.push(Number(id));
  }
  root.innerHTML = `
    <div class="card">
      <h2>⭐ Избранное</h2>
      ${favIds.length ? '' : '<p class="muted">Пока пусто. Отмечайте фразы звёздочкой во время обучения.</p>'}
      <div class="list" id="fav-list"></div>
    </div>
    <div class="card">
      <h2>⚑ Сложные</h2>
      ${diffIds.length ? '' : '<p class="muted">Пока пусто. Отмечайте сложные фразы, чтобы вернуться к ним.</p>'}
      <div class="list" id="diff-list"></div>
    </div>
  `;
  fillSimpleList(root.querySelector('#fav-list'), favIds);
  fillSimpleList(root.querySelector('#diff-list'), diffIds);
}

function fillSimpleList(listEl, ids) {
  if (!ids.length) return;
  ids.forEach(id => {
    const p = phraseById(id);
    if (!p) return;
    const item = el('div', { class: 'list-item' });
    item.innerHTML = `
      <div class="num">${p.id}</div>
      <div class="body">
        <div class="en">${p.en}</div>
        <div class="ru">${p.ru}</div>
      </div>
      <div class="actions"><button class="btn">🔊</button><button class="btn">▶</button></div>
    `;
    item.querySelector('.actions button:nth-child(1)').onclick = () => Speech1000.speak(p.en, { rate: settings.rate });
    item.querySelector('.actions button:nth-child(2)').onclick = () => startSession([p.id], 'fav');
    listEl.appendChild(item);
  });
}

// STATS
function renderStats() {
  const root = document.getElementById('view-stats');
  const learned = Storage1000.learnedCount(progress);
  const mastered = Storage1000.masteredCount(progress);
  const total = PHRASES.length;
  const streak = Storage1000.currentStreak(progress);
  const totalMin = Math.round((progress.stats.totalTimeSec || 0) / 60);

  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const h = progress.stats.history[key] || { studied: 0, correct: 0, timeSec: 0 };
    days.push({ key, ...h });
  }
  const maxStudied = Math.max(1, ...days.map(d => d.studied));

  root.innerHTML = `
    <div class="card">
      <h2>Статистика</h2>
      <div class="grid-3" style="margin-top:12px">
        ${statCard('🔥', 'Серия дней', String(streak))}
        ${statCard('📚', 'Изучено', learned + ' / ' + total)}
        ${statCard('🏆', 'Закреплено', mastered + ' / ' + total)}
      </div>
    </div>
    <div class="card">
      <h3>Активность за 14 дней</h3>
      <div class="bars" id="bars"></div>
      <p class="muted small" style="margin-top:8px">Всего времени: ${totalMin} мин</p>
    </div>
    <div class="card">
      <h3>Прогресс по темам</h3>
      <div id="topics-progress"></div>
    </div>
  `;

  const bars = root.querySelector('#bars');
  days.forEach(d => {
    const h = Math.round((d.studied / maxStudied) * 120);
    const bar = el('div', { class: 'bar' });
    bar.innerHTML = `<div class="col" style="height:${Math.max(2, h)}px"></div>
      <div class="val">${d.studied || ''}</div>
      <div class="lbl">${d.key.slice(5)}</div>`;
    bars.appendChild(bar);
  });

  const tp = root.querySelector('#topics-progress');
  Object.entries(TOPICS).forEach(([k, t]) => {
    const ids = PHRASES.filter(p => p.topic === k).map(p => p.id);
    const l = ids.filter(id => progress.phrases[id] && progress.phrases[id].successes >= 3).length;
    const row = el('div', { style: 'margin:10px 0' });
    row.innerHTML = `<div class="row between"><span>${t.icon} ${t.name}</span><span class="muted small">${l}/${ids.length}</span></div>
      <div class="progress" style="margin-top:6px"><i style="width:${Math.round(l/ids.length*100)}%"></i></div>`;
    tp.appendChild(row);
  });
}

// SETTINGS
function renderSettings() {
  const root = document.getElementById('view-settings');
  root.innerHTML = `
    <div class="card">
      <h2>Настройки</h2>

      <div class="settings-row">
        <div><div class="lbl">Голос</div><div class="hint">Выберите озвучку</div></div>
        <select id="set-voice" style="max-width:260px"></select>
      </div>
      <div class="settings-row">
        <div><div class="lbl">Скорость речи</div><div class="hint" id="rate-val">${settings.rate.toFixed(2)}</div></div>
        <input type="range" id="set-rate" min="0.5" max="1.5" step="0.05" value="${settings.rate}" style="max-width:200px">
      </div>
      <div class="settings-row">
        <div><div class="lbl">Порог проверки</div><div class="hint" id="thr-val">${Math.round(settings.threshold*100)}%</div></div>
        <input type="range" id="set-thr" min="0.5" max="1" step="0.05" value="${settings.threshold}" style="max-width:200px">
      </div>
      <div class="settings-row">
        <div><div class="lbl">Показывать транскрипцию</div></div>
        <div class="switch ${settings.showTranscription?'on':''}" id="set-tr"></div>
      </div>
      <div class="settings-row">
        <div><div class="lbl">Показывать перевод</div></div>
        <div class="switch ${settings.showTranslation?'on':''}" id="set-ru"></div>
      </div>
      <div class="settings-row">
        <div><div class="lbl">Тёмная тема</div></div>
        <div class="switch ${settings.theme==='dark'?'on':''}" id="set-theme"></div>
      </div>
      <div class="settings-row">
        <div>
          <div class="lbl">Звуковые эффекты</div>
          <div class="hint">Звук при правильном и неправильном ответе</div>
        </div>
        <div class="switch ${settings.soundsEnabled !== false ? 'on' : ''}" id="set-sounds"></div>
      </div>
      <div class="settings-row">
        <div>
          <div class="lbl">Автоматическая озвучка</div>
          <div class="hint">Произносить фразу при её появлении</div>
        </div>
        <div class="switch ${settings.autoSpeak !== false ? 'on' : ''}" id="set-autospeak"></div>
      </div>
      <div class="settings-row">
        <div><div class="lbl">Фраз в день</div><div class="hint">Для ежедневной цели</div></div>
        <input type="number" id="set-perday" class="input" min="5" max="50" value="${settings.phrasesPerDay}" style="max-width:120px">
      </div>
    </div>

    <div class="card" id="audio-diag-card">
      <h3>🔧 Диагностика звука</h3>
      <p class="muted small">Проверка аудио-движка. Нажмите кнопки — услышите звук. Результат появится ниже.</p>
      <div class="row" style="margin:10px 0">
        <button class="btn" id="test-correct">✅ Тест: правильный</button>
        <button class="btn" id="test-wrong">❌ Тест: неправильный</button>
        <button class="btn" id="test-refresh">🔄 Обновить статус</button>
      </div>
      <pre id="audio-diag" style="background:var(--surface-2);padding:12px;border-radius:8px;font-size:12px;overflow:auto;white-space:pre-wrap">—</pre>
    </div>

    <div class="card">
      <h3>Данные</h3>
      <div class="row">
        <button class="btn" id="btn-export">📤 Экспорт прогресса</button>
        <button class="btn" id="btn-import">📥 Импорт прогресса</button>
        <input type="file" id="file-import" accept="application/json" style="display:none">
        <button class="btn danger" id="btn-reset">🗑 Сбросить прогресс</button>
      </div>
    </div>
  `;

  const vsel = root.querySelector('#set-voice');
  voices.forEach(v => {
    const o = document.createElement('option');
    o.value = v.voiceURI;
    o.textContent = v.name + ' — ' + v.lang;
    if (settings.voiceURI === v.voiceURI) o.selected = true;
    vsel.appendChild(o);
  });
  if (!voices.length) {
    const o = document.createElement('option');
    o.textContent = 'Голоса не загружены';
    vsel.appendChild(o);
  }
  vsel.onchange = () => {
    settings.voiceURI = vsel.value;
    const v = voices.find(x => x.voiceURI === settings.voiceURI);
    if (v) { Speech1000.setVoice(v); Speech1000.speak('Hello! Nice to meet you.', { rate: settings.rate }); }
    Storage1000.saveSettings(settings);
  };

  root.querySelector('#set-rate').oninput = (e) => {
    settings.rate = Number(e.target.value);
    root.querySelector('#rate-val').textContent = settings.rate.toFixed(2);
    Storage1000.saveSettings(settings);
  };
  root.querySelector('#set-thr').oninput = (e) => {
    settings.threshold = Number(e.target.value);
    root.querySelector('#thr-val').textContent = Math.round(settings.threshold*100) + '%';
    Storage1000.saveSettings(settings);
  };
  root.querySelector('#set-tr').onclick = (e) => {
    settings.showTranscription = !settings.showTranscription;
    e.currentTarget.classList.toggle('on', settings.showTranscription);
    Storage1000.saveSettings(settings);
  };
  root.querySelector('#set-ru').onclick = (e) => {
    settings.showTranslation = !settings.showTranslation;
    e.currentTarget.classList.toggle('on', settings.showTranslation);
    Storage1000.saveSettings(settings);
  };
  root.querySelector('#set-theme').onclick = (e) => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    e.currentTarget.classList.toggle('on', settings.theme === 'dark');
    applyTheme();
    Storage1000.saveSettings(settings);
  };
  root.querySelector('#set-sounds').onclick = (e) => {
    settings.soundsEnabled = !(settings.soundsEnabled !== false);
    e.currentTarget.classList.toggle('on', settings.soundsEnabled);
    Storage1000.saveSettings(settings);
    if (settings.soundsEnabled) {
      try { SoundEngine.unlock(); SoundEngine.playCorrect(); } catch (err) {}
    }
  };
  root.querySelector('#set-autospeak').onclick = (e) => {
    settings.autoSpeak = !(settings.autoSpeak !== false);
    e.currentTarget.classList.toggle('on', settings.autoSpeak);
    Storage1000.saveSettings(settings);
  };
  root.querySelector('#set-perday').onchange = (e) => {
    settings.phrasesPerDay = Math.max(5, Math.min(50, Number(e.target.value) || 10));
    Storage1000.saveSettings(settings);
    toast('Сохранено');
  };

  // Диагностика
  function updateDiag() {
    const d = SoundEngine.diagnose();
    const lines = [
      'AudioContext: ' + (d.hasAC ? 'есть' : 'НЕТ'),
      'Состояние: ' + d.state,
      'SampleRate: ' + d.sampleRate,
      'Последний результат: ' + d.lastResult
    ];
    root.querySelector('#audio-diag').textContent = lines.join('\n');
  }
  updateDiag();
  root.querySelector('#test-correct').onclick = () => {
    SoundEngine.unlock();
    SoundEngine.playCorrect();
    setTimeout(updateDiag, 300);
  };
  root.querySelector('#test-wrong').onclick = () => {
    SoundEngine.unlock();
    SoundEngine.playWrong();
    setTimeout(updateDiag, 300);
  };
  root.querySelector('#test-refresh').onclick = updateDiag;

  // Данные
  root.querySelector('#btn-export').onclick = () => Storage1000.exportProgress(progress);
  root.querySelector('#btn-import').onclick = () => root.querySelector('#file-import').click();
  root.querySelector('#file-import').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      await Storage1000.importProgress(f);
      progress = Storage1000.loadProgress();
      toast('Прогресс импортирован');
      renderSettings();
    } catch (err) {
      toast('Ошибка импорта: ' + err.message);
    }
  };
  root.querySelector('#btn-reset').onclick = () => {
    if (confirm('Сбросить весь прогресс? Это действие необратимо.')) {
      Storage1000.resetProgress();
      progress = Storage1000.loadProgress();
      toast('Прогресс сброшен');
      navigate('home');
    }
  };
}

// HELP
function renderHelp() {
  const root = document.getElementById('view-help');
  root.innerHTML = `
    <div class="card">
      <h2>Помощь</h2>
      <h3>Как пользоваться</h3>
      <ol style="line-height:1.7">
        <li>Начните с «Главная» — нажмите «Продолжить обучение».</li>
        <li>Фраза произносится автоматически (если включена «Автоматическая озвучка»).</li>
        <li>Нажмите 🎤 и произнесите фразу. Прозвучит сигнал правильного или неправильного ответа.</li>
        <li>Выберите: <b>✅ Запомнил</b> — в повторение с длинным интервалом; <b>⏰ Позже</b> — вернуть завтра; <b>🔁 Ещё раз</b> — попробовать снова.</li>
        <li>После 3 успешных повторов фраза становится «выученной».</li>
      </ol>
      <h3>Нет звука?</h3>
      <ol style="line-height:1.7">
        <li>Зайдите в ⚙️ Настройки → «🔧 Диагностика звука».</li>
        <li>Нажмите «✅ Тест: правильный» и «❌ Тест: неправильный».</li>
        <li>В блоке ниже появятся строки: «Состояние: running» — значит движок работает. Если «suspended» — нажмите тест ещё раз, чтобы разбудить.</li>
        <li>Проверьте громкость вкладки и системный звук. Выключите mute.</li>
      </ol>
      <h3>Микрофон</h3>
      <p class="muted">Разрешите доступ к микрофону в браузере. Лучше всего работает в Chrome и Edge. На телефоне откройте сайт по HTTPS (GitHub Pages подходит).</p>
      <h3>Проверка микрофона</h3>
      <div class="row" style="margin-top:8px">
        <button class="btn primary" id="mic-test">🎤 Проверить микрофон</button>
        <span id="mic-test-result" class="muted small"></span>
      </div>
    </div>
  `;
  root.querySelector('#mic-test').onclick = () => {
    const out = root.querySelector('#mic-test-result');
    if (!Speech1000.recognitionAvailable) {
      out.textContent = 'Распознавание недоступно в этом браузере.';
      return;
    }
    out.textContent = 'Говорите...';
    Speech1000.listenOnce({
      onResult: (alts) => { out.textContent = 'Услышано: "' + (alts[0] || '') + '"'; },
      onError: (e) => { out.textContent = 'Ошибка: ' + e; }
    });
  };
}

// INIT
applyRoute();