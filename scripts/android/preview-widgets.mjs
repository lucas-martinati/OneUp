/** Illustrative browser preview of the native XML layouts; no device data needed.
 * Run: node scripts/android/preview-widgets.mjs
 * Keep the emblem geometry in sync with WidgetLevelEmblem.java / LevelEmblem.jsx.
 */
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const resources = new URL('../../android/app/src/main/res/', import.meta.url);
const output = new URL('../../test-results/', import.meta.url);
await mkdir(output, { recursive: true });
const layouts = await Promise.all(['small', 'large'].map(size => readFile(new URL(`layout/widget_streak_${size}.xml`, resources), 'utf8')));
const flame = await readFile(new URL('drawable/ic_flame.xml', resources), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 760, height: 400 }, deviceScaleFactor: 2 });
  await page.setContent(`<style>
    *{box-sizing:border-box}body{margin:0;padding:32px;background:#101019;color:#eee;font-family:Arial,sans-serif}
    h1{font-size:22px;margin:0 0 8px}p{color:#9694a9;font-size:13px;margin:0 0 32px}
    main{display:flex;gap:28px;align-items:center}section>p{margin:16px 0 0;text-align:center;font-size:12px}
    .widget{border-radius:24px;border:0;background:linear-gradient(180deg,#ffffff14,transparent),linear-gradient(135deg,#8b5cf61a,#6d28d90c,#0ea5e916),linear-gradient(135deg,#0a0a12,#0b0a14,#08080e)}
    svg{display:block;width:100%;height:100%}
  </style><h1>Les niveaux, dans tes widgets.</h1><p>Aperçu simulé des layouts Android · données d’exemple</p><main></main>`);
  await page.evaluate(({ layouts, flame }) => {
    const parser = new DOMParser();
    const attr = (el, name) => el.getAttribute(`android:${name}`);
    const emblem = (level, today = false) => {
      const color = level === 0 ? '#94a3b8' : level === 10 ? '#fbbf24' : level >= 7 ? '#c4b5fd' : '#67e8f9';
      const point = angle => `${20 + 17.5 * Math.cos(angle * Math.PI / 180)} ${20 + 17.5 * Math.sin(angle * Math.PI / 180)}`;
      return `<svg viewBox="-2 -2 44 44"><path d="M20 7 31 13.5V25L20 33 9 25V13.5Z" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-opacity=".45" stroke-width=".8"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${point(-85 + i * 36)} A17.5 17.5 0 0 1 ${point(-59 + i * 36)}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" opacity="${i < level ? 1 : .15}"/>`).join('')}${today ? '<circle cx="20" cy="20" r="19.2" fill="none" stroke="#22d3ee" stroke-opacity=".63" stroke-width=".7"/>' : ''}<text x="20" y="20" dominant-baseline="central" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="17" font-weight="700">${level}</text></svg>`;
    };
    const flameDoc = parser.parseFromString(flame, 'text/xml');
    const flameSvg = `<svg viewBox="0 0 24 24"><defs><linearGradient id="fire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fbbf24"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs>${[...flameDoc.querySelectorAll('path')].map(p => {
      const color = attr(p, 'fillColor');
      const fill = color ? (color.length === 9 ? `#${color.slice(3)}${color.slice(1, 3)}` : color) : 'url(#fire)';
      return `<path d="${attr(p, 'pathData')}" fill="${fill}"/>`;
    }).join('')}</svg>`;
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const levels = [3, 5, 7, 10, 0, 0, 0];
    function render(el, parent) {
      const image = el.tagName === 'ImageView';
      const text = el.tagName === 'TextView';
      const node = document.createElement('div');
      const id = (attr(el, 'id') || '').replace('@+id/', '');
      node.id = id;
      node.style.flexShrink = '0';
      const px = value => value?.replace(/dp|sp/g, 'px');
      for (const dimension of ['width', 'height']) {
        const value = attr(el, `layout_${dimension}`);
        if (value === 'match_parent') node.style[dimension] = '100%';
        else if (value !== 'wrap_content') node.style[dimension] = px(value);
      }
      if (attr(el, 'layout_weight')) {
        node.style.flexGrow = attr(el, 'layout_weight');
        node.style.flexShrink = '1';
      }
      for (const [android, css] of Object.entries({ padding:'padding', paddingStart:'paddingLeft', paddingEnd:'paddingRight', paddingTop:'paddingTop', paddingBottom:'paddingBottom', layout_marginStart:'marginLeft', layout_marginEnd:'marginRight', layout_marginTop:'marginTop', layout_marginBottom:'marginBottom' })) {
        if (attr(el, android)) node.style[css] = px(attr(el, android));
      }
      if (!text && !image) {
        node.style.display = 'flex';
        node.style.flexDirection = attr(el, 'orientation') === 'horizontal' ? 'row' : 'column';
        const gravity = attr(el, 'gravity');
        if (gravity === 'center') { node.style.alignItems = 'center'; node.style.justifyContent = 'center'; }
        if (gravity === 'center_vertical') node.style.alignItems = 'center';
        if (el.tagName === 'FrameLayout') node.style.alignItems = 'center';
      }
      if (text) {
        node.textContent = attr(el, 'text');
        node.style.fontSize = px(attr(el, 'textSize'));
        node.style.lineHeight = '1.1';
        const color = attr(el, 'textColor');
        if (color) node.style.color = color.length === 9 ? `#${color.slice(3)}${color.slice(1, 3)}` : color;
        if (attr(el, 'textStyle') === 'bold') node.style.fontWeight = '700';
        if (attr(el, 'letterSpacing')) node.style.letterSpacing = `${attr(el, 'letterSpacing')}em`;
        if (attr(el, 'gravity') === 'center') node.style.textAlign = 'center';
        if (id.endsWith('streak_count')) node.textContent = '12';
        if (id.endsWith('streak_label')) node.textContent = id.includes('large') ? 'JOURS' : 'SÉRIE';
        if (id.startsWith('label_')) {
          const index = days.indexOf(id.slice(6));
          node.textContent = ['L', 'M', 'M', 'J', 'V', 'S', 'D'][index];
          node.style.color = levels[index] === 10 ? '#fbbf24' : levels[index] >= 7 ? '#c4b5fd' : levels[index] > 0 ? '#67e8f9' : index === 4 ? '#22d3ee' : '#ffffff60';
        }
      }
      if (image) {
        if (id.includes('flame')) node.innerHTML = flameSvg;
        else if (id.endsWith('streak_level')) node.innerHTML = emblem(7);
        else if (id.startsWith('dot_')) { const i = days.indexOf(id.slice(4)); node.innerHTML = emblem(levels[i], i === 4); }
        else node.style.background = '#ffffff18';
      }
      parent.appendChild(node);
      for (const child of el.children) render(child, node);
      return node;
    }
    layouts.forEach((xml, index) => {
      const section = document.createElement('section');
      document.querySelector('main').appendChild(section);
      const root = render(parser.parseFromString(xml, 'text/xml').documentElement, section);
      root.classList.add('widget');
      root.style.width = index === 0 ? '160px' : '340px';
      root.style.height = index === 0 ? '80px' : '148px';
      const caption = document.createElement('p');
      caption.textContent = index === 0 ? 'Petit · streak + niveau' : 'Grand · niveau de chaque jour';
      section.appendChild(caption);
    });
  }, { layouts, flame });
  await page.screenshot({ path: new URL('widgets-levels-preview.png', output).pathname });
  // omitBackground only clears the browser's default backdrop. Explicit page
  // backgrounds must also be removed, otherwise PNG corners remain opaque.
  await page.addStyleTag({ content: 'html, body { background: transparent !important; } .widget { border: 0; }' });
  for (const size of ['small', 'large']) {
    await page.locator(`#widget_${size}_root`).screenshot({ path: new URL(`drawable-nodpi/widget_preview_${size}.png`, resources).pathname, omitBackground: true });
  }
  console.log(`Preview: ${new URL('widgets-levels-preview.png', output).pathname}`);
} finally {
  await browser.close();
}
