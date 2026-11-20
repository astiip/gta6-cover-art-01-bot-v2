// Palm Light cover renderer — draws the whole poster on any canvas.
// One function, drawCover, owns every pixel: the six photo panels, the
// colour grade, the giant gradient title, the script subtitle, the star
// quote, the tagline bar, the VOL badge, the gold seal, the barcode and
// the footer. The editor and the screenshot scenes both call it, so what
// the user previews is exactly what the PNG export contains.

export const SIZES = {
  landscape: { w: 1920, h: 1080, label: '1920 × 1080' },
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
};

export const GRADES = {
  sunset: { name: 'Sunset', wash: ['rgba(255,120,40,0.22)', 'rgba(255,40,120,0.15)'], tint: 'rgba(255,170,60,0.10)' },
  neon: { name: 'Neon', wash: ['rgba(255,0,160,0.24)', 'rgba(0,220,255,0.17)'], tint: 'rgba(180,0,255,0.10)' },
  dusk: { name: 'Dusk', wash: ['rgba(40,60,180,0.24)', 'rgba(120,40,160,0.17)'], tint: 'rgba(60,40,140,0.12)' },
};

export const SAMPLE_FILES = [
  'convertible.jpg',
  'neonman.jpg',
  'lifeguard.jpg',
  'boulevard-night.jpg',
  'pier.jpg',
  'boulevard.jpg',
];

export const PANEL_LABELS = [
  'THE WHEELMAN',
  'THE FIXER',
  'STATION 5',
  'THE STRIP',
  'PIER 9',
  'PALM ROW',
];

// A fresh editor state: six panels with the bundled sample photos, the
// default Palm Light words, the Sunset grade and the landscape size.
export function defaultState() {
  return {
    title: 'PALM LIGHT',
    subtitle: 'golden hour, every hour',
    tagline: 'SIX FRAMES · ONE CITY · NO CURFEW',
    quote: 'A COASTLINE FULL OF TROUBLE',
    source: 'THE VICE HERALD',
    vol: 'VOL. 2',
    footerLeft: 'OUT THIS SUMMER',
    footerMid: 'A PALM LIGHT PICTURE · STARRING YOU · MADE FROM YOUR OWN PHOTOS',
    grade: 'sunset',
    size: 'landscape',
    panels: PANEL_LABELS.map((label, i) => ({
      label,
      file: SAMPLE_FILES[i],
      img: null,
      zoom: 1,
      ox: 0,
      oy: 0,
    })),
  };
}

// The cover's geometry for a canvas of W by H: the six panel rects plus
// the strips around them. The editor reuses this for hit-testing, so a
// click on the preview always lands on the panel it looks like.
export function panelRects(W, H) {
  const m = Math.round(W * 0.016);
  const topH = Math.round(H * 0.062);
  const footH = Math.round(H * 0.082);
  const gap = Math.max(6, Math.round(W * 0.007));
  const gx = m;
  const gy = topH + Math.round(H * 0.008);
  const gw = W - 2 * m;
  const gh = H - gy - footH - Math.round(H * 0.008);
  const pw = (gw - 2 * gap) / 3;
  const ph = (gh - gap) / 2;
  const rects = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      rects.push({ x: gx + col * (pw + gap), y: gy + row * (ph + gap), w: pw, h: ph });
    }
  }
  return { rects, m, topH, footH, gap, gx, gy, gw, gh };
}

function coverFit(ctx, img, x, y, w, h, zoom, ox, oy) {
  if (!img || !img.naturalWidth) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#3a1550');
    g.addColorStop(1, '#160826');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = x + (w - dw) / 2 + ox * w * 0.25;
  const dy = y + (h - dh) / 2 + oy * h * 0.25;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPanelLabel(ctx, rect, label, W, pos) {
  const fs = Math.max(13, Math.round(W * 0.0145));
  ctx.font = `800 ${fs}px Arial, Helvetica, sans-serif`;
  const tw = ctx.measureText(label).width;
  const padX = Math.round(W * 0.008);
  const chipH = fs + Math.round(W * 0.008);
  const chipX = rect.x + Math.round(W * 0.006);
  const chipY = pos === 'top'
    ? rect.y + Math.round(W * 0.006)
    : rect.y + rect.h - chipH - Math.round(W * 0.006);
  const chipW = tw + padX * 2 + Math.round(W * 0.006);
  ctx.fillStyle = 'rgba(8,2,16,0.88)';
  ctx.fillRect(chipX, chipY, chipW, chipH);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(chipX, chipY, Math.round(W * 0.005), chipH);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(label, chipX + padX + Math.round(W * 0.005), chipY + chipH / 2 + 1);
}

function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.82;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#f7b500';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.strokeStyle = '#8a5a00';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd94d';
  ctx.fill();
  ctx.fillStyle = '#3a2400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(r * 0.26)}px Arial, Helvetica, sans-serif`;
  ctx.fillText('ORIGINAL', 0, -r * 0.24);
  ctx.fillText('COVER ART', 0, r * 0.08);
  ctx.font = `${Math.round(r * 0.26)}px Arial, Helvetica, sans-serif`;
  ctx.fillText('★ ★ ★', 0, r * 0.38);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 1, 1, 3, 2, 1, 4, 1, 2, 1, 1, 3, 1, 2, 1];
  let bx = x + w * 0.06;
  const bw = (w * 0.88) / bars.length;
  ctx.fillStyle = '#111111';
  for (const b of bars) {
    const barW = Math.max(1, bw * (b / 4));
    ctx.fillRect(bx, y + h * 0.1, barW, h * 0.72);
    bx += bw;
  }
}

// Draws the full poster. ctx is a 2d context of a canvas exactly W by H.
export function drawCover(ctx, W, H, state) {
  const { rects, m, topH, footH, gap, gy, gh } = panelRects(W, H);
  const grade = GRADES[state.grade] ?? GRADES.sunset;

  // Deep violet night backdrop with a warm glow behind the title.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b0a40');
  bg.addColorStop(0.55, '#1c0530');
  bg.addColorStop(1, '#0e0218');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.52, 10, W / 2, H * 0.52, W * 0.45);
  glow.addColorStop(0, 'rgba(255,120,60,0.20)');
  glow.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Six photo panels, each graded and framed.
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const r = rects[i];
    const p = state.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    coverFit(ctx, p.img, r.x, r.y, r.w, r.h, p.zoom, p.ox, p.oy);
    const wash = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grade.tint;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    ctx.lineWidth = Math.max(2, Math.round(W * 0.0022));
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();

  // Top strip: the VOL badge on the left, the star quote centred.
  const volFs = Math.max(15, Math.round(W * 0.02));
  ctx.font = `900 ${volFs}px Arial, Helvetica, sans-serif`;
  const volW = ctx.measureText(state.vol).width + volFs * 1.1;
  const volH = Math.round(topH * 0.62);
  const volY = Math.round((topH - volH) / 2);
  ctx.fillStyle = '#ffc400';
  ctx.fillRect(m, volY, volW, volH);
  ctx.fillStyle = '#14001f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.vol, m + volW / 2, volY + volH / 2 + 1);

  const qFs = Math.max(14, Math.round(W * 0.0175));
  ctx.font = `800 ${qFs}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = '#ffffff';
  const stars = '★ ★ ★ ★ ★  ';
  const quoteText = `${stars}"${state.quote}"  —  ${state.source}`;
  ctx.fillText(quoteText, W / 2 + volW / 2, topH / 2 + 1);

  // The giant gradient title across the middle of the grid, shrunk just
  // enough to fit the poster's width whatever the title says.
  const titleMaxW = W * 0.96;
  let titleSize = Math.round(W * 0.15);
  for (;;) {
    ctx.font = `900 ${titleSize}px "Arial Black", Arial, Helvetica, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(titleSize * 0.025)}px`;
    } catch {
      // Older canvas builds ignore letterSpacing; the title still lands.
    }
    if (ctx.measureText(state.title).width <= titleMaxW || titleSize <= 40) break;
    titleSize = Math.round(titleSize * 0.94);
  }
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.letterSpacing = `${Math.round(titleSize * 0.025)}px`;
  } catch {
    // Older canvas builds ignore letterSpacing; the title still lands.
  }
  ctx.font = `900 ${titleSize}px "Arial Black", Arial, Helvetica, sans-serif`;
  const titleY = gy + gh * 0.52;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.round(W * 0.012);
  ctx.shadowOffsetY = Math.round(W * 0.005);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.round(W * 0.011);
  ctx.strokeStyle = '#3b0646';
  ctx.strokeText(state.title, W / 2, titleY);
  const tg = ctx.createLinearGradient(0, titleY - titleSize * 0.55, 0, titleY + titleSize * 0.55);
  tg.addColorStop(0, '#ffe45c');
  tg.addColorStop(0.45, '#ff9a3d');
  tg.addColorStop(1, '#ff4d8d');
  ctx.fillStyle = tg;
  ctx.fillText(state.title, W / 2, titleY);
  ctx.restore();
  // The title's letter spacing must not leak into the rest of the poster.
  ctx.letterSpacing = '0px';

  // Script subtitle, glowing pink, just under the title.
  const subSize = Math.max(20, Math.round(W * 0.046));
  ctx.save();
  ctx.font = `italic 700 ${subSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = Math.round(W * 0.014);
  ctx.fillStyle = '#ffd7ec';
  ctx.fillText(state.subtitle, W / 2, titleY + titleSize * 0.6 + subSize * 0.5);
  ctx.restore();

  // Tagline on a black bar across the lower row.
  const tagFs = Math.max(13, Math.round(W * 0.02));
  ctx.font = `800 ${tagFs}px Arial, Helvetica, sans-serif`;
  const tagW = ctx.measureText(state.tagline).width + tagFs * 2.4;
  const tagH = tagFs + Math.round(W * 0.012);
  const tagX = (W - tagW) / 2;
  const tagY = gy + gh * 0.84 - tagH / 2;
  ctx.fillStyle = 'rgba(8,2,16,0.92)';
  ctx.fillRect(tagX, tagY, tagW, tagH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline, W / 2, tagY + tagH / 2 + 1);

  // Panel labels last, so the title never buries one: top row at the
  // top-left of its panel, bottom row at the bottom-left.
  for (let i = 0; i < 6; i++) {
    drawPanelLabel(ctx, rects[i], state.panels[i].label, W, i < 3 ? 'top' : 'bottom');
  }

  // Footer: release line left, credit line centre, barcode right.
  const footY = H - footH;
  const leftFs = Math.max(15, Math.round(W * 0.024));
  ctx.font = `italic 900 ${leftFs}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff4d8d';
  ctx.fillText(state.footerLeft, m, footY + footH / 2 + 1);
  const midFs = Math.max(11, Math.round(W * 0.0115));
  ctx.font = `700 ${midFs}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(state.footerMid, W / 2, footY + footH / 2 + 1);
  const bcW = Math.round(W * 0.075);
  const bcH = Math.round(footH * 0.62);
  drawBarcode(ctx, W - m - bcW, footY + (footH - bcH) / 2, bcW, bcH);

  // Gold seal, top-right, overlapping the first row's corner.
  drawSeal(ctx, W - m - Math.round(W * 0.048), gy + Math.round(W * 0.048), Math.round(W * 0.046));

  // A soft vignette so the panels melt into the night.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(20,0,40,0)');
  vg.addColorStop(1, 'rgba(20,0,40,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}
