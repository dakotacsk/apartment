'use strict';
const $ = (id) => document.getElementById(id);
const body = document.body;
const dialog = $('settings-dialog');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const names = { candlelight: 'Candlelight', ember: 'Ember', midnight: 'Midnight' };
let preferences = { mood: 'candlelight', brightness: 75, paused: reducedMotion.matches, awake: true };
try {
  const stored = JSON.parse(localStorage.getItem('the-haunt-display') || '{}');
  if (names[stored.mood]) preferences.mood = stored.mood;
  if (Number.isFinite(stored.brightness)) preferences.brightness = Math.min(100, Math.max(20, stored.brightness));
  if (typeof stored.paused === 'boolean' && !reducedMotion.matches) preferences.paused = stored.paused;
  if (typeof stored.awake === 'boolean') preferences.awake = stored.awake;
} catch { /* Display still works with unavailable or malformed local storage. */ }
let hideTimer;
let toastTimer;
let wakeLock = null;
let wakeRequest = null;
let lastPointerTime = 0;
function save() { try { localStorage.setItem('the-haunt-display', JSON.stringify(preferences)); } catch {} }
function applyPreferences() {
  body.dataset.mood = preferences.mood;
  body.style.setProperty('--light-opacity', preferences.brightness / 100);
  $('mood-label').textContent = names[preferences.mood];
  $('brightness').value = preferences.brightness;
  $('brightness-value').value = `${preferences.brightness}%`;
  $('keep-awake').checked = preferences.awake;
  body.classList.toggle('motion-paused', preferences.paused);
  const motionLabel = preferences.paused ? 'Resume motion' : 'Pause motion';
  $('motion-button').setAttribute('aria-label', motionLabel);
  $('motion-button').setAttribute('title', motionLabel);
  $('motion-button').setAttribute('aria-pressed', String(preferences.paused));
  $('motion-button').firstElementChild.className = `icon ${preferences.paused ? 'play' : 'pause'}`;
  document.querySelectorAll('[data-mood-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.moodChoice === preferences.mood)));
}
function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 5000);
}
function showControls() {
  clearTimeout(hideTimer);
  body.classList.remove('controls-hidden');
  if ((document.fullscreenElement || body.classList.contains('lights-only')) && !dialog.open) {
    hideTimer = setTimeout(() => {
      if (dialog.open || document.querySelector('.display-controls :focus-visible')) return;
      body.classList.add('controls-hidden');
    }, 5500);
  }
}
function toggleMotion() {
  if (reducedMotion.matches) { toast('Motion is off because your device prefers reduced motion.'); return; }
  preferences.paused = !preferences.paused;
  applyPreferences(); save(); showControls();
}
function toggleAmbient() {
  const active = body.classList.toggle('lights-only');
  $('ambient-button').setAttribute('aria-pressed', String(active));
  $('ambient-label').textContent = active ? 'Show welcome' : 'Lights only';
  $('welcome').setAttribute('aria-hidden', String(active));
  updateHint(); showControls();
}
function updateHint() {
  $('display-hint').textContent = document.fullscreenElement || body.classList.contains('lights-only') ? 'Move your mouse, tap, or press a key for controls.' : 'Settle in. Make yourself at home.';
}
async function syncWakeLock() {
  const requested = preferences.awake && document.fullscreenElement && document.visibilityState === 'visible';
  if (!requested) {
    if (wakeLock) { const current = wakeLock; wakeLock = null; try { await current.release(); } catch {} }
    $('awake-status').textContent = 'Active when supported in full screen.';
    return;
  }
  if (!('wakeLock' in navigator)) { $('awake-status').textContent = 'Use your device sleep settings in this browser.'; return; }
  if (wakeLock || wakeRequest) return;
  wakeRequest = navigator.wakeLock.request('screen');
  try {
    const lock = await wakeRequest;
    if (!preferences.awake || !document.fullscreenElement || document.visibilityState !== 'visible') { await lock.release(); return; }
    wakeLock = lock;
    $('awake-status').textContent = 'Keeping this display awake.';
    lock.addEventListener('release', () => {
      if (wakeLock === lock) wakeLock = null;
      $('awake-status').textContent = 'Screen wake lock released by your browser.';
    });
  } catch { $('awake-status').textContent = 'Use your device sleep settings if the display sleeps.'; }
  finally { wakeRequest = null; }
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else toast('Full screen is unavailable here. Try your browser’s full-screen view.');
  } catch { toast('Full screen could not open. Try your browser’s full-screen view.'); }
  showControls();
}
$('settings-button').addEventListener('click', () => { showControls(); dialog.showModal(); });
$('close-settings').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
dialog.addEventListener('close', showControls);
document.querySelectorAll('[data-mood-choice]').forEach(button => button.addEventListener('click', () => { preferences.mood = button.dataset.moodChoice; applyPreferences(); save(); }));
$('brightness').addEventListener('input', event => { preferences.brightness = Number(event.target.value); applyPreferences(); save(); });
$('keep-awake').addEventListener('change', event => { preferences.awake = event.target.checked; save(); syncWakeLock(); });
$('motion-button').addEventListener('click', toggleMotion);
$('ambient-button').addEventListener('click', toggleAmbient);
$('fullscreen-button').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement);
  $('fullscreen-label').textContent = active ? 'Exit full screen' : 'Full screen';
  $('fullscreen-button').firstElementChild.className = `icon ${active ? 'contract' : 'expand'}`;
  updateHint(); showControls(); syncWakeLock();
});
document.addEventListener('visibilitychange', syncWakeLock);
document.addEventListener('pointermove', () => { const now = performance.now(); if (now - lastPointerTime > 150) { lastPointerTime = now; showControls(); } }, { passive: true });
document.addEventListener('pointerdown', showControls, { passive: true });
document.addEventListener('focusin', showControls);
document.addEventListener('focusout', () => setTimeout(showControls, 0));
document.addEventListener('keydown', event => {
  showControls();
  if (dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,button,a,[contenteditable]')) return;
  if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  if (event.key.toLowerCase() === 'l') { event.preventDefault(); toggleAmbient(); }
  if (event.code === 'Space') { event.preventDefault(); toggleMotion(); }
});
reducedMotion.addEventListener('change', event => { if (event.matches) preferences.paused = true; applyPreferences(); });
// A small, fixed particle layer keeps the scene quiet and the display inexpensive.
for (let i = 0; i < 22; i++) {
  const light = document.createElement('span');
  light.className = 'firefly';
  light.style.left = `${6 + Math.random() * 88}%`;
  light.style.top = `${20 + Math.random() * 75}%`;
  light.style.setProperty('--duration', `${16 + Math.random() * 20}s`);
  light.style.setProperty('--delay', `${-Math.random() * 36}s`);
  light.style.setProperty('--drift', `${Math.random() * 90 - 45}px`);
  $('fireflies').appendChild(light);
}
applyPreferences();
