// Web Speech API: синтез и распознавание речи

let voicesCache = [];
let chosenVoice = null;

function loadVoices() {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve([]); return; }
    const tryGet = () => {
      const v = speechSynthesis.getVoices();
      if (v && v.length) { voicesCache = v; resolve(v); return true; }
      return false;
    };
    if (tryGet()) return;
    speechSynthesis.onvoiceschanged = () => { tryGet(); };
    setTimeout(() => { tryGet(); resolve(voicesCache); }, 800);
  });
}

// Выбрать «красивый женский американский» голос
function pickBestVoice(voices, savedURI) {
  if (!voices || !voices.length) return null;
  if (savedURI) {
    const saved = voices.find(v => v.voiceURI === savedURI);
    if (saved) return saved;
  }
  const us = voices.filter(v => /en-US/i.test(v.lang));
  const femaleNames = ['samantha', 'victoria', 'karen', 'moira', 'tessa', 'zira', 'aria', 'jenny', 'google us english', 'google uk english female'];
  // 1) известные женские американские
  for (const name of femaleNames) {
    const found = us.find(v => v.name.toLowerCase().includes(name));
    if (found) return found;
  }
  // 2) любая американская
  if (us.length) return us[0];
  // 3) любая английская
  const en = voices.filter(v => /^en/i.test(v.lang));
  if (en.length) return en[0];
  return voices[0];
}

function setVoice(voice) { chosenVoice = voice; }

function speak(text, opts = {}) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  if (chosenVoice) u.voice = chosenVoice;
  u.rate = opts.rate != null ? opts.rate : 0.95;
  u.pitch = 1.05;
  u.volume = 1;
  if (opts.onend) u.onend = opts.onend;
  speechSynthesis.speak(u);
}

function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// --- Распознавание ---
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognitionAvailable = !!SpeechRec;

let recognizer = null;
let recActive = false;

function createRecognizer() {
  if (!SpeechRec) return null;
  const r = new SpeechRec();
  r.lang = 'en-US';
  r.interimResults = false;
  r.maxAlternatives = 3;
  r.continuous = false;
  return r;
}

function listenOnce({ onResult, onError, onEnd }) {
  if (!SpeechRec) {
    onError && onError('not-supported');
    return;
  }
  if (recActive) {
    try { recognizer.stop(); } catch (e) {}
  }
  recognizer = createRecognizer();
  recActive = true;
  recognizer.onresult = (ev) => {
    const alts = [];
    for (let i = 0; i < ev.results[0].length; i++) alts.push(ev.results[0][i].transcript);
    onResult && onResult(alts);
  };
  recognizer.onerror = (ev) => {
    recActive = false;
    onError && onError(ev.error || 'error');
  };
  recognizer.onend = () => {
    recActive = false;
    onEnd && onEnd();
  };
  try { recognizer.start(); }
  catch (e) { recActive = false; onError && onError('start-failed'); }
}

function stopListening() {
  if (recognizer && recActive) {
    try { recognizer.stop(); } catch (e) {}
  }
}

// --- Сравнение ---
function normalize(s) {
  return (s || '').toLowerCase()
    .replace(/[.,!?;:'"()\[\]{}—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length, n = b.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function wordSimilarity(a, b) {
  if (a === b) return 1;
  const dist = levenshtein(a, b);
  const len = Math.max(a.length, b.length);
  return len === 0 ? 1 : 1 - dist / len;
}

// Матч: возвращает { score, words: [{text, ok}] }
function matchPhrase(original, spoken) {
  const ow = normalize(original).split(' ').filter(Boolean);
  const sw = normalize(spoken).split(' ').filter(Boolean);
  const used = new Array(sw.length).fill(false);
  const words = [];
  let sum = 0;

  for (const w of ow) {
    let best = 0, bestIdx = -1;
    for (let i = 0; i < sw.length; i++) {
      if (used[i]) continue;
      const sim = wordSimilarity(w, sw[i]);
      if (sim > best) { best = sim; bestIdx = i; }
    }
    if (bestIdx !== -1 && best >= 0.7) {
      used[bestIdx] = true;
      sum += best;
      words.push({ text: w, ok: true });
    } else {
      words.push({ text: w, ok: false });
    }
  }
  const score = ow.length ? sum / ow.length : 0;
  return { score, words, spoken: (spoken || '').trim() };
}

window.Speech1000 = {
  loadVoices, pickBestVoice, setVoice, speak, stopSpeaking,
  recognitionAvailable, listenOnce, stopListening,
  matchPhrase, normalize
};