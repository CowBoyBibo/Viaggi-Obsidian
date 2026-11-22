/*
 * Applica il tema Tabi alla build Quartz.
 * Uso, dalla radice del repository:
 *   npx quartz build
 *   node tools/apply-tabi.mjs
 *
 * Lo script non tocca i sorgenti né i Markdown: copia il tema in public/_theme
 * e inserisce CSS, script del tema e script anticipato in ogni pagina HTML.
 * È idempotente: rilanciarlo non duplica i tag.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'public');
const theme = path.join(root, 'theme', 'tabi');
const themeOut = path.join(site, '_theme');
const version = Date.now().toString(36);

const FONTS =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@400;500;600&family=Noto+Serif+JP:wght@400;600&display=swap';

const EARLY = `<script data-tabi-theme="early">(function(){var r=document.documentElement;r.classList.add('js');var p=new URLSearchParams(location.search);if(p.get('capture')==='1')r.classList.add('capture');var t=p.get('theme');if(t==='sumi'||t==='dark'){r.setAttribute('saved-theme','dark');return;}if(t==='washi'||t==='light'){r.setAttribute('saved-theme','light');return;}try{var s=localStorage.getItem('theme');if(s!=='light'&&s!=='dark'){s='dark';localStorage.setItem('theme','dark');}r.setAttribute('saved-theme',s);}catch(e){r.setAttribute('saved-theme','dark');}})();</script>`;

async function walk(directory, out = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

try {
  await fs.access(site);
} catch {
  console.error('public/ non trovata. Esegui prima: npx quartz build');
  process.exit(1);
}

await fs.mkdir(themeOut, { recursive: true });
await fs.copyFile(path.join(theme, 'theme.css'), path.join(themeOut, 'theme.css'));
await fs.copyFile(path.join(theme, 'theme.js'), path.join(themeOut, 'theme.js'));

const files = await walk(site);
let injected = 0;

for (const file of files) {
  let html = await fs.readFile(file, 'utf8');
  html = html.replace(
    /<!-- tabi-theme:start -->[\s\S]*?<!-- tabi-theme:end -->\s*/g,
    '',
  );

  const relative = path.relative(path.dirname(file), site).split(path.sep).join('/');
  let prefix = relative ? `${relative}/` : './';

  // GitHub Pages serve 404.html for any missing URL, so a relative asset path
  // would resolve against the requested URL instead of the file. Reuse the
  // absolute base path Quartz already writes in the 404 page.
  if (path.basename(file) === '404.html') {
    const baseMatch = html.match(/href="([^"]*)\/index\.css"/);
    if (baseMatch) prefix = baseMatch[1] ? `${baseMatch[1]}/` : '/';
  }

  if (!html.includes('</head>')) {
    console.warn(`skip (no head): ${path.relative(site, file)}`);
    continue;
  }

  const headBlock = `<!-- tabi-theme:start -->
<link rel="preconnect" href="https://fonts.googleapis.com" data-tabi-theme="fonts" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin data-tabi-theme="fonts" />
<link rel="stylesheet" href="${FONTS}" data-tabi-theme="fonts" />
${EARLY}
<link rel="stylesheet" href="${prefix}_theme/theme.css?v=${version}" data-tabi-theme="css" />
<!-- tabi-theme:end -->`;

  html = html.replace('</head>', `${headBlock}\n</head>`);

  // Il tag body non ha un commento contenitore: rimuoviamo la copia precedente.
  html = html.replace(/<script[^>]*data-tabi-theme="js"[^>]*><\/script>\s*/g, '');
  const bodyBlock = `<script src="${prefix}_theme/theme.js?v=${version}" data-tabi-theme="js"></script>`;
  html = html.replace('</body>', `${bodyBlock}\n</body>`);

  await fs.writeFile(file, html, 'utf8');
  injected += 1;
}

console.log(`Tabi applicato a ${injected} pagine HTML`);
console.log(`Asset: ${path.relative(root, themeOut)}`);
