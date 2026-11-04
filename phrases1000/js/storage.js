// Работа с localStorage
const STORAGE_KEY = 'phrases1000_progress_v1';
const SETTINGS_KEY = 'phrases1000_settings_v1';

const INTERVALS = [0, 1, 3, 7, 14, 30]; // дней

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function defaultProgress() {
  return {
    version: 1,
    phrases: {},
    stats: {
      streak: 0,
      lastStudyDate: null,
      totalTimeSec: 0,
      history: {}
    }
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const data = JSON.parse(raw);
    if (!data.phrases) data.phrases = {};
    if (!data.stats) data.stats = defaultProgress().stats;
    return data;
  } catch (e) {
    console.warn('loadProgress error', e);
    return defaultProgress();
  }
}

function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
  catch (e) { console.warn('saveProgress error', e); }
}

function defaultSettings() {
  return {
    voiceURI: '',
    rate: 0.95,
    threshold: 0.8,
    showTranscription: true,
    showTranslation: true,
    theme: 'light',
    phrasesPerDay: 10,
    soundsEnabled: true,   // 🔊 звуки правильно/неправильно
    autoSpeak: true        // 🔊 автопроизношение новой фразы
  };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return Object.assign(defaultSettings(), JSON.parse(raw));
  } catch (e) { return defaultSettings(); }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
  catch (e) { console.warn('saveSettings error', e); }
}

function getPhraseState(p, id) {
  if (!p.phrases[id]) {
    p.phrases[id] = { attempts: 0, successes: 0, box: 0, nextReview: 0, favorite: false, difficult: false, lastResult: 0 };
  }
  return p.phrases[id];
}

function phraseStatus(ps) {
  if (ps.successes === 0) return 'new';
  if (ps.box >= 5) return 'mastered';
  if (ps.successes >= 3) return 'learned';
  return 'learning';
}

function phraseStatusLabel(st) {
  return { new: 'Новая', learning: 'Изучаю', learned: 'Выучена', mastered: 'Закреплена' }[st] || st;
}

function phraseStatusColor(st) {
  return { new: '#9aa0a6', learning: '#f5a623', learned: '#34a853', mastered: '#1a73e8' }[st] || '#9aa0a6';
}

function recordAttempt(p, id, correct, score) {
  const ps = getPhraseState(p, id);
  ps.attempts += 1;
  ps.lastResult = score;
  if (correct) {
    ps.successes += 1;
    if (ps.successes >= 3 && ps.box < 5) ps.box += 1;
  } else {
    ps.box = Math.max(0, ps.box - 1);
    if (ps.successes > 0) ps.successes -= 1;
  }
  const days = INTERVALS[Math.min(ps.box, INTERVALS.length - 1)];
  ps.nextReview = Date.now() + days * 24 * 3600 * 1000;

  const key = todayKey();
  const hist = p.stats.history[key] || { studied: 0, correct: 0, timeSec: 0 };
  hist.studied += 1;
  if (correct) hist.correct += 1;
  p.stats.history[key] = hist;

  updateStreak(p);
  saveProgress(p);
  return ps;
}

function addTime(p, sec) {
  p.stats.totalTimeSec += sec;
  const key = todayKey();
  const hist = p.stats.history[key] || { studied: 0, correct: 0, timeSec: 0 };
  hist.timeSec += sec;
  p.stats.history[key] = hist;
  saveProgress(p);
}

function updateStreak(p) {
  const today = todayKey();
  if (p.stats.lastStudyDate === today) return;
  if (p.stats.lastStudyDate) {
    const prev = new Date(p.stats.lastStudyDate + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const diff = Math.round((now - prev) / 86400000);
    if (diff === 1) p.stats.streak += 1;
    else if (diff > 1) p.stats.streak = 1;
  } else {
    p.stats.streak = 1;
  }
  p.stats.lastStudyDate = today;
}

function currentStreak(p) {
  if (!p.stats.lastStudyDate) return 0;
  const today = todayKey();
  if (p.stats.lastStudyDate === today) return p.stats.streak;
  const prev = new Date(p.stats.lastStudyDate + 'T00:00:00');
  const now = new Date(today + 'T00:00:00');
  const diff = Math.round((now - prev) / 86400000);
  if (diff === 1) return p.stats.streak;
  return 0;
}

function duePhrases(p) {
  const now = Date.now();
  const out = [];
  for (const id in p.phrases) {
    const ps = p.phrases[id];
    if (ps.successes > 0 && ps.nextReview <= now) out.push(Number(id));
  }
  return out;
}

function newPhrasesIds(p, limit) {
  const out = [];
  for (let i = 0; i < PHRASES.length && out.length < limit; i++) {
    const id = PHRASES[i].id;
    const ps = p.phrases[id];
    if (!ps || ps.successes === 0) out.push(id);
  }
  return out;
}

function learnedCount(p) {
  let n = 0;
  for (const id in p.phrases) if (p.phrases[id].successes >= 3) n++;
  return n;
}

function masteredCount(p) {
  let n = 0;
  for (const id in p.phrases) if (p.phrases[id].box >= 5) n++;
  return n;
}

function exportProgress(p) {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'phrases1000-progress-' + todayKey() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || !data.phrases) throw new Error('Неверный формат файла');
        saveProgress(data);
        resolve(data);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

window.Storage1000 = {
  loadProgress, saveProgress, getPhraseState, phraseStatus, phraseStatusLabel, phraseStatusColor,
  recordAttempt, addTime, currentStreak, duePhrases, newPhrasesIds, learnedCount, masteredCount,
  exportProgress, importProgress, resetProgress, loadSettings, saveSettings, todayKey
};