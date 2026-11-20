// Palm Light screenshot scenes — fixed, repeatable views of the app for
// screenshots/. ?shot=editor shows the editor with the sample photos
// loaded. ?shot=cover&size=landscape|square|portrait hides the editor and
// draws the cover full-bleed on its own canvas at the export size, so the
// screenshot is the app's own drawing of the cover it exports.

import { SIZES, drawCover } from './cover.js';

const q = new URLSearchParams(location.search);
const shot = q.get('shot');

if (shot === 'cover') {
  const size = SIZES[q.get('size')] ? q.get('size') : 'landscape';
  window.__shotReady = (async () => {
    await window.palmReady;
    const editor = document.getElementById('editor');
    if (editor) editor.style.display = 'none';
    const c = document.getElementById('shot');
    const { w, h } = SIZES[size];
    c.width = w;
    c.height = h;
    c.style.display = 'block';
    drawCover(c.getContext('2d'), w, h, window.PalmLight.state);
    document.title = `Palm Light cover ${size}`;
  })();
} else {
  window.__shotReady = window.palmReady;
}
