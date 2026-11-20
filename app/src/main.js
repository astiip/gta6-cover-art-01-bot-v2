// Palm Light editor — wires the cover renderer to the page: photos,
// crops, words, grade, sizes, drag-to-pan, live preview and PNG export.
// Everything runs offline; a photo a person picks is read on their own
// machine and never leaves it.

import { GRADES, SIZES, defaultState, drawCover, panelRects } from './cover.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
let selected = 0;
let drag = null;

const preview = $('preview');
const pctx = preview.getContext('2d');

function currentSize() {
  return SIZES[state.size];
}

function render() {
  const { w, h } = currentSize();
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(pctx, w, h, state);
  syncPanelButtons();
}

function syncPanelButtons() {
  document.querySelectorAll('#panels button').forEach((b, i) => {
    b.classList.toggle('active', i === selected);
    b.textContent = `${i + 1} · ${state.panels[i].label}`;
  });
  const p = state.panels[selected];
  $('zoom').value = String(p.zoom);
  $('offx').value = String(p.ox);
  $('offy').value = String(p.oy);
  $('label').value = p.label;
  $('zoomval').textContent = `${Math.round(p.zoom * 100)}%`;
  $('offxval').textContent = p.ox.toFixed(2);
  $('offyval').textContent = p.oy.toFixed(2);
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('photo could not be read'));
    };
    img.src = url;
  });
}

function loadSample(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sample ${file} failed to load`));
    img.src = `samples/${file}`;
  });
}

async function loadSamples() {
  const loaded = await Promise.all(state.panels.map((p) => loadSample(p.file).catch(() => null)));
  loaded.forEach((img, i) => {
    if (img) state.panels[i].img = img;
  });
}

function bindText(id, key) {
  $(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    render();
  });
}

function bindGradeAndSize() {
  document.querySelectorAll('input[name="grade"]').forEach((r) => {
    r.addEventListener('change', () => {
      state.grade = r.value;
      render();
    });
  });
  document.querySelectorAll('input[name="size"]').forEach((r) => {
    r.addEventListener('change', () => {
      state.size = r.value;
      render();
    });
  });
}

function bindPanels() {
  document.querySelectorAll('#panels button').forEach((b, i) => {
    b.addEventListener('click', () => {
      selected = i;
      syncPanelButtons();
    });
  });
  $('file-one').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state.panels[selected].img = await loadImageFile(file);
      state.panels[selected].file = file.name;
      render();
    } catch {
      $('status').textContent = 'That photo could not be read — try another file.';
    }
    e.target.value = '';
  });
  $('file-all').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFile(file);
      state.panels.forEach((p) => {
        p.img = img;
        p.file = file.name;
      });
      render();
    } catch {
      $('status').textContent = 'That photo could not be read — try another file.';
    }
    e.target.value = '';
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    render();
  });
  $('offx').addEventListener('input', (e) => {
    state.panels[selected].ox = Number(e.target.value);
    render();
  });
  $('offy').addEventListener('input', (e) => {
    state.panels[selected].oy = Number(e.target.value);
    render();
  });
  $('label').addEventListener('input', (e) => {
    state.panels[selected].label = e.target.value.toUpperCase();
    render();
  });
}

function bindCanvas() {
  const toCanvas = (e) => {
    const r = preview.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * preview.width,
      y: ((e.clientY - r.top) / r.height) * preview.height,
    };
  };
  preview.addEventListener('pointerdown', (e) => {
    const { x, y } = toCanvas(e);
    const { rects } = panelRects(preview.width, preview.height);
    const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (hit < 0) return;
    selected = hit;
    syncPanelButtons();
    drag = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy, moved: false };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { x, y } = toCanvas(e);
    const dx = x - drag.x;
    const dy = y - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    const p = state.panels[selected];
    const { rects } = panelRects(preview.width, preview.height);
    const r = rects[selected];
    p.ox = Math.max(-1, Math.min(1, drag.ox + (dx / r.w) * 4));
    p.oy = Math.max(-1, Math.min(1, drag.oy + (dy / r.h) * 4));
    render();
  });
  preview.addEventListener('pointerup', () => {
    drag = null;
  });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[selected];
    p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    render();
  }, { passive: false });
}

function exportPNG() {
  const { w, h } = currentSize();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off.getContext('2d'), w, h, state);
  off.toBlob((blob) => {
    if (!blob) {
      $('status').textContent = 'Export failed in this browser — try again.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palm-light-${state.size}-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('status').textContent = `Exported palm-light-${state.size}-${w}x${h}.png — post it.`;
  }, 'image/png');
}

bindText('title', 'title');
bindText('subtitle', 'subtitle');
bindText('tagline', 'tagline');
bindText('quote', 'quote');
bindGradeAndSize();
bindPanels();
bindCanvas();
$('export').addEventListener('click', exportPNG);

// The screenshot scenes and the live page share this handle.
window.PalmLight = { state, render, exportPNG };
window.palmReady = loadSamples().then(() => {
  render();
  $('status').textContent = 'Sample photos loaded — swap in your own, edit the words, export.';
});
