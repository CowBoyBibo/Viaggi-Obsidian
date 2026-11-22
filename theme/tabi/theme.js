/* ==========================================================================
   ARCHIVE OF MY JOURNEY — WASHI / SUMI
   Livello di interazione additivo per la copia locale del blog Quartz.
   Funziona con la navigazione SPA di Quartz (eventi prenav / nav).
   ========================================================================== */

(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const CAPTURE = params.get('capture') === '1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  root.classList.add('js');
  if (CAPTURE) root.classList.add('capture');

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  /* Quartz porta in vista il link attivo dell'Esplora con scrollIntoView:
     nella nostra colonna non scorrevole trascina giù tutta la pagina.
     Neutralizziamo solo quel caso, lasciando intatti TOC e ancore. */
  const nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    if (this instanceof Element && this.closest('.explorer') && !window.location.hash) return;
    return nativeScrollIntoView.apply(this, args);
  };

  let revealObserver = null;
  let parallaxItems = [];
  let tableObservers = [];
  let scrollTicking = false;
  let themeTimer = null;
  let cursorElement = null;
  let curtainCreated = false;

  /* ------------------------------------------------------------------
     Tema: la URL può forzare Washi (chiaro) o Sumi (scuro)
     ------------------------------------------------------------------ */

  const applyUrlTheme = () => {
    const value = params.get('theme');
    if (value === 'washi' || value === 'light') {
      root.setAttribute('saved-theme', 'light');
    } else if (value === 'sumi' || value === 'dark') {
      root.setAttribute('saved-theme', 'dark');
    }
  };

  applyUrlTheme();

  const isDark = () => root.getAttribute('saved-theme') === 'dark';

  const updateThemeUi = () => {
    const dark = isDark();
    const labels = $$('.tabi-theme-label');
    labels.forEach((label) => {
      label.textContent = dark ? 'Sumi' : 'Washi';
    });

    $$('.darkmode').forEach((button) => {
      button.setAttribute('title', dark ? 'Passa al tema Washi' : 'Passa al tema Sumi');
      button.setAttribute('aria-label', dark ? 'Passa al tema Washi' : 'Passa al tema Sumi');
    });

    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0c0b09' : '#f3ecde');
  };

  const ensureThemeLabel = () => {
    const button = $('.darkmode');
    if (!button) return;

    const row = button.parentElement;
    if (row) {
      row.classList.add('tabi-theme-row');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '0.4rem';
    }

    if (!$('.tabi-theme-label', row || document)) {
      const label = document.createElement('span');
      label.className = 'tabi-theme-label';
      label.dataset.tabi = 'theme-label';
      label.setAttribute('aria-hidden', 'true');
      button.insertAdjacentElement('afterend', label);
    }

    updateThemeUi();
  };

  const flashThemeTransition = () => {
    root.classList.add('tabi-theme-transition');
    window.clearTimeout(themeTimer);
    themeTimer = window.setTimeout(() => root.classList.remove('tabi-theme-transition'), 460);
  };

  /* ------------------------------------------------------------------
     Sfondo persistente: il kanji 旅 sulla destra
     ------------------------------------------------------------------ */

  const ensureBackdrop = () => {
    if ($('.tabi-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'tabi-backdrop';
    backdrop.dataset.tabiFixed = '';
    backdrop.setAttribute('aria-hidden', 'true');

    const kanji = document.createElement('span');
    kanji.className = 'tabi-backdrop__kanji';
    kanji.textContent = '旅';

    backdrop.append(kanji);
    document.body.prepend(backdrop);
  };

  /* ------------------------------------------------------------------
     Pulizia della pagina prima di una nuova navigazione SPA
     ------------------------------------------------------------------ */

  const unwrapFigure = (figure) => {
    const images = $$('img', figure);
    const paragraph = document.createElement('p');
    images.forEach((image) => paragraph.append(image));
    figure.replaceWith(paragraph);
  };

  const restoreSplit = (title) => {
    if (title.dataset.tabiOriginal != null) {
      title.innerHTML = title.dataset.tabiOriginal;
    }
    title.classList.remove('tabi-split', 'is-in');
    delete title.dataset.tabi;
    delete title.dataset.tabiOriginal;
  };

  const removeReveal = () => {
    $$('[data-tabi-reveal]').forEach((element) => {
      element.removeAttribute('data-tabi-reveal');
      element.classList.remove('is-revealed');
      element.style.removeProperty('--tabi-delay');
    });
  };

  const removeParallax = () => {
    $$('[data-tabi-parallax]').forEach((element) => {
      element.removeAttribute('data-tabi-parallax');
      element.style.removeProperty('--tabi-parallax-y');
    });
    $$('[data-tabi-tilt]').forEach((element) => {
      element.removeAttribute('data-tabi-tilt');
      delete element.dataset.tabiTiltBound;
      element.style.removeProperty('--tabi-rx');
      element.style.removeProperty('--tabi-ry');
    });
    parallaxItems = [];
  };

  const teardownPage = () => {
    $$('[data-tabi]').forEach((element) => {
      const kind = element.dataset.tabi;
      if (kind === 'split') {
        restoreSplit(element);
      } else if (kind === 'figure') {
        unwrapFigure(element);
      } else {
        element.remove();
      }
    });

    $$('.tabi-cover').forEach((element) => element.classList.remove('tabi-cover'));
    document.body?.classList.remove('tabi-home');
    removeReveal();
    removeParallax();

    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    tableObservers.forEach((observer) => observer.disconnect());
    tableObservers = [];
  };

  /* ------------------------------------------------------------------
     Titoli: parole che salgono da una maschera
     ------------------------------------------------------------------ */

  const splitTitle = (title) => {
    if (!title || title.classList.contains('tabi-split')) return;

    title.dataset.tabi = 'split';
    title.dataset.tabiOriginal = title.innerHTML;

    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      if (!node.textContent.trim()) continue;
      const fragment = document.createDocumentFragment();

      for (const part of node.textContent.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(part));
          continue;
        }
        const outer = document.createElement('span');
        outer.className = 'word';
        const inner = document.createElement('span');
        inner.className = 'word__inner';
        inner.textContent = part;
        outer.append(inner);
        fragment.append(outer);
      }

      node.replaceWith(fragment);
    }

    $$('.word', title).forEach((word, index) => {
      word.style.setProperty('--i', String(index));
    });

    title.classList.add('tabi-split');
    window.requestAnimationFrame(() => title.classList.add('is-in'));
  };

  /* ------------------------------------------------------------------
     Etichette e meta di pagina
     ------------------------------------------------------------------ */

  const getKind = (slug) => {
    if (slug.includes('Itinerari')) return 'Itinerario';
    if (slug.includes('Viaggi')) return 'Diario di viaggio';
    if (slug.includes('Suggerimenti')) return 'Suggerimento';
    return 'Appunto';
  };

  const addKicker = (header, label) => {
    if (!header || $('.tabi-kicker', header)) return;
    const kicker = document.createElement('div');
    kicker.className = 'tabi-kicker';
    kicker.dataset.tabi = 'kicker';

    const first = document.createElement('span');
    first.textContent = label;

    kicker.append(first);
    header.prepend(kicker);
  };

  const addPageMeta = (title, html) => {
    if (!title) return;
    const meta = document.createElement('div');
    meta.className = 'tabi-page-meta';
    meta.dataset.tabi = 'page-meta';
    meta.innerHTML = html;
    title.insertAdjacentElement('afterend', meta);
  };

  const decorateHome = () => {
    const title = $('.article-title');

    if (title && !$('.tabi-hero-jp')) {
      const vertical = document.createElement('div');
      vertical.className = 'tabi-hero-jp';
      vertical.dataset.tabi = 'hero-jp';
      vertical.setAttribute('aria-hidden', 'true');
      vertical.textContent = '旅の記録';
      title.insertAdjacentElement('afterend', vertical);
    }

    const article = $('.center article');
    const firstParagraph = article ? $(':scope > p', article) : null;
    const coverImage = firstParagraph ? $('img', firstParagraph) : null;

    if (coverImage && firstParagraph.children.length === 1) {
      firstParagraph.classList.add('tabi-cover');

      const stamp = document.createElement('span');
      stamp.className = 'tabi-stamp';
      stamp.dataset.tabi = 'cover-extra';
      stamp.setAttribute('aria-hidden', 'true');
      stamp.textContent = '旅';
      firstParagraph.append(stamp);
    }

    const pageHeader = $('.page-header');
    if (pageHeader && !$('.tabi-ticker')) {
      const words = [
        'Tokyo',
        'Kyoto',
        'Nara',
        'Osaka',
        'Ramen',
        'Gyoza',
        'Sushi',
        'Sakura',
        'Onsen',
        'Templi',
        'Treni',
      ];

      const ticker = document.createElement('div');
      ticker.className = 'tabi-ticker';
      ticker.dataset.tabi = 'ticker';
      ticker.setAttribute('aria-hidden', 'true');

      const track = document.createElement('div');
      track.className = 'tabi-ticker__track';

      const makeGroup = () => {
        const group = document.createElement('div');
        group.className = 'tabi-ticker__group';
        for (const word of words) {
          const span = document.createElement('span');
          span.textContent = word;
          group.append(span);
        }
        return group;
      };

      track.append(makeGroup(), makeGroup());
      ticker.append(track);
      pageHeader.insertAdjacentElement('afterend', ticker);
    }
  };

  const decorateContent = (slug) => {
    const header = $('.page-header .popover-hint');
    if (!header) return;
    addKicker(header, getKind(slug));
  };

  const decorateListing = (slug) => {
    const header = $('.page-header .popover-hint');
    const title = $('.article-title');
    if (!header || !title) return;

    const count = $$('.page-listing .section-li').length;
    const isTag = slug.startsWith('tags/');

    if (title.textContent.trim().startsWith('Cartella:')) {
      const breadcrumbs = $$('.breadcrumb-element');
      const current = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1].textContent.trim() : '';
      if (current) title.textContent = current;
    } else if (title.textContent.trim().startsWith('Etichetta:')) {
      const tag = title.textContent.split(':').slice(1).join(':').trim();
      title.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    }

    addKicker(header, isTag ? 'Etichetta' : 'Archivio');

    addPageMeta(
      title,
      `<span><b>${count}</b> ${count === 1 ? 'voce' : 'voci'}</span><span>Giappone</span>`,
    );
  };

  /* ------------------------------------------------------------------
     Fotografie: figure editoriali con didascalia reale
     ------------------------------------------------------------------ */

  const cleanLabel = (value) => {
    const text = value.replace(/\s+/g, ' ').trim();
    if (text.length <= 74) return text;
    return `${text.slice(0, 71).trim()}…`;
  };

  const decorateFigures = () => {
    const article = $('.center article');
    if (!article) return;

    // Un paragrafo può contenere una sola foto oppure un dittico (due immagini).
    const paragraphs = $$(':scope > p', article).filter((paragraph) => {
      const children = Array.from(paragraph.children);
      if (!children.length) return false;
      if (!children.every((child) => child.tagName === 'IMG')) return false;
      if (paragraph.textContent.trim()) return false;
      return !children.some((image) => image.closest('.tabi-cover'));
    });

    let index = 0;

    for (const paragraph of paragraphs) {
      const images = Array.from(paragraph.children).filter((child) => child.tagName === 'IMG');
      if (!images.length) continue;

      let previous = paragraph.previousElementSibling;
      while (previous && !/^H[1-3]$/.test(previous.tagName)) previous = previous.previousElementSibling;

      const label = previous ? cleanLabel(previous.textContent) : 'Giappone';
      index += 1;

      const figure = document.createElement('figure');
      figure.className = 'tabi-figure';
      figure.dataset.tabi = 'figure';

      const makeMedia = (image) => {
        const media = document.createElement('div');
        media.className = 'tabi-figure__media';
        media.dataset.tabiTilt = '';
        media.append(image);

        image.classList.add('tabi-parallax');
        image.dataset.tabiParallax = '0.07';
        return media;
      };

      if (images.length === 1) {
        const image = images[0];
        figure.append(makeMedia(image));

        const markPortrait = () => {
          if (image.naturalWidth && image.naturalHeight > image.naturalWidth * 1.06) {
            figure.classList.add('is-portrait');
          }
        };

        if (image.complete) markPortrait();
        else image.addEventListener('load', markPortrait, { once: true });
      } else {
        figure.classList.add('tabi-figure--duo');
        const pair = document.createElement('div');
        pair.className = 'tabi-figure__pair';
        images.forEach((image) => pair.append(makeMedia(image)));
        figure.append(pair);
      }

      const caption = document.createElement('figcaption');
      const left = document.createElement('span');
      const number = document.createElement('b');
      number.textContent = String(index).padStart(2, '0');
      left.append(number, document.createTextNode(` · ${label}`));
      const right = document.createElement('span');
      right.textContent = images.length > 1 ? `${images.length} fotografie` : 'Fotografia';
      caption.append(left, right);

      figure.append(caption);
      paragraph.replaceWith(figure);
    }
  };

  /* ------------------------------------------------------------------
     Local Guide: lasciapassare da viaggio, non badge di interfaccia
     ------------------------------------------------------------------ */

  const JP_LEVELS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  const toJapaneseLevel = (value) => {
    const level = Number.parseInt(value, 10);
    if (Number.isInteger(level) && level >= 1 && level <= 10) return JP_LEVELS[level];
    return value;
  };

  const decorateLocalGuide = () => {
    const widget = $('.local-guide-widget');
    if (!widget) return;

    const text = widget.textContent.replace(/\s+/g, ' ').trim();
    const levelMatch = text.match(/Livello\s+([^\s·•]+)/i);
    const level = levelMatch ? levelMatch[1] : '5';

    const stats = $$(':scope > div:last-child > div', widget)
      .map((node) => {
        const value = $('strong', node)?.textContent.trim() || '';
        let label = $('span', node)?.textContent.trim() || '';
        if (/views?/i.test(label)) label = 'Visualizzazioni';
        return { value, label };
      })
      .filter((stat) => stat.value);

    if (!stats.length) return;

    const guide = document.createElement('aside');
    guide.className = 'tabi-guide';
    guide.setAttribute(
      'aria-label',
      `Google Local Guide, livello ${level}, contributore reale`,
    );

    const vertical = document.createElement('span');
    vertical.className = 'tabi-guide__vertical';
    vertical.setAttribute('aria-hidden', 'true');
    vertical.textContent = '旅の案内人';

    const head = document.createElement('div');
    head.className = 'tabi-guide__head';

    const seal = document.createElement('span');
    seal.className = 'tabi-guide__seal';
    seal.setAttribute('aria-hidden', 'true');
    seal.textContent = toJapaneseLevel(level);

    const identity = document.createElement('div');
    identity.className = 'tabi-guide__identity';

    const kicker = document.createElement('p');
    kicker.className = 'tabi-guide__kicker';
    kicker.textContent = 'Google Local Guide';

    const title = document.createElement('p');
    title.className = 'tabi-guide__title';
    title.textContent = 'Guida locale';

    const role = document.createElement('p');
    role.className = 'tabi-guide__role';
    role.textContent = `Livello ${level} · Contributore Reale`;

    identity.append(kicker, title, role);
    head.append(seal, identity);

    const list = document.createElement('dl');
    list.className = 'tabi-guide__stats';

    stats.forEach(({ value, label }) => {
      const row = document.createElement('div');
      row.className = 'tabi-guide__stat';

      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;

      row.append(term, detail);
      list.append(row);
    });

    guide.append(vertical, head, list);
    widget.replaceWith(guide);
  };

  /* ------------------------------------------------------------------
     Tabelle larghe: su mobile restano scorrevoli, ma lo diciamo.
     ------------------------------------------------------------------ */

  const decorateTables = () => {
    $$('.table-container').forEach((container) => {
      if (container.dataset.tabiTable) return;
      container.dataset.tabiTable = '';

      const hint = document.createElement('p');
      hint.className = 'tabi-table-hint';
      hint.dataset.tabi = 'table-hint';
      hint.innerHTML = '<span>Scorri la tabella</span><span aria-hidden="true">→</span>';
      container.insertAdjacentElement('afterend', hint);

      const update = () => {
        const scrollable = container.scrollWidth > container.clientWidth + 4;
        const atEnd =
          container.scrollLeft + container.clientWidth >= container.scrollWidth - 4;
        hint.hidden = !scrollable || atEnd;
      };

      update();
      container.addEventListener('scroll', update, { passive: true });
      if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(update);
        observer.observe(container);
        observer.observe(container.firstElementChild || container);
        tableObservers.push(observer);
      }
      if (document.fonts?.ready) document.fonts.ready.then(update);
    });
  };

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */

  const setupReveal = () => {
    const selectors = [
      '.tabi-kicker',
      '.tabi-cover',
      '.tabi-ticker',
      '.tabi-guide',
      'article > h1',
      'article > h2',
      'article > h3',
      '.callout',
      '.table-container',
      '.tabi-figure',
      '.tabi-home article > ul',
      '.tabi-home article .transclude',
      '.page-listing .section-li',
    ];

    const targets = [];
    selectors.forEach((selector) => {
      $$(selector).forEach((element) => {
        if (element.dataset.tabiReveal) return;
        element.dataset.tabiReveal = '';
        targets.push(element);
      });
    });

    $$('.page-listing .section-li').forEach((element, index) => {
      element.style.setProperty('--tabi-delay', `${Math.min(index * 70, 280)}ms`);
    });
    $$('.tabi-figure').forEach((element, index) => {
      element.style.setProperty('--tabi-delay', `${Math.min(index * 40, 160)}ms`);
    });

    if (CAPTURE || reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('is-revealed'));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.05 },
    );

    targets.forEach((element) => revealObserver.observe(element));
  };

  /* ------------------------------------------------------------------
     Parallasse e tilt
     ------------------------------------------------------------------ */

  const updateParallax = () => {
    if (!parallaxItems.length || CAPTURE || reducedMotion) return;

    const viewport = window.innerHeight;
    for (const image of parallaxItems) {
      const rect = image.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > viewport + 160) continue;
      const speed = Number.parseFloat(image.dataset.tabiParallax) || 0.07;
      const offset = (rect.top + rect.height / 2 - viewport / 2) * speed;
      const clamped = Math.max(-28, Math.min(28, offset));
      image.style.setProperty('--tabi-parallax-y', `${clamped.toFixed(2)}px`);
    }
  };

  const setupMotion = () => {
    parallaxItems = $$('[data-tabi-parallax]');

    if (CAPTURE || reducedMotion) return;

    if (finePointer) {
      $$('[data-tabi-tilt]').forEach((media) => {
        if (media.dataset.tabiTiltBound) return;
        media.dataset.tabiTiltBound = 'true';

        media.addEventListener(
          'pointermove',
          (event) => {
            const rect = media.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            media.style.setProperty('--tabi-ry', `${(x * 3.2).toFixed(2)}deg`);
            media.style.setProperty('--tabi-rx', `${(-y * 3.2).toFixed(2)}deg`);
          },
          { passive: true },
        );

        media.addEventListener('pointerleave', () => {
          media.style.setProperty('--tabi-ry', '0deg');
          media.style.setProperty('--tabi-rx', '0deg');
        });
      });
    }

    updateParallax();
  };

  /* ------------------------------------------------------------------
     Interfaccia persistente: progresso, torna su, cursore, sipario
     ------------------------------------------------------------------ */

  const ensureSkipLink = () => {
    if ($('.tabi-skip')) return;
    const skip = document.createElement('a');
    skip.className = 'tabi-skip';
    skip.href = '#quartz-body';
    skip.textContent = 'Vai al contenuto';
    skip.dataset.tabiFixed = '';
    document.body.prepend(skip);
  };

  const ensureProgress = () => {
    if ($('.tabi-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'tabi-progress';
    bar.dataset.tabiFixed = '';
    bar.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    bar.append(fill);
    document.body.prepend(bar);
  };

  const ensureBackToTop = () => {
    if ($('.tabi-top')) return;
    const top = document.createElement('a');
    top.className = 'tabi-top';
    top.dataset.tabiFixed = '';
    top.href = '#top';
    top.setAttribute('aria-label', 'Torna all’inizio');
    top.textContent = '↑';
    top.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    document.body.append(top);
  };

  const ensureCursor = () => {
    if (!finePointer || reducedMotion || CAPTURE || window.innerWidth <= 800) return;
    if ($('.tabi-cursor')) return;

    const cursor = document.createElement('div');
    cursor.className = 'tabi-cursor';
    cursor.dataset.tabiFixed = '';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.append(cursor);
    cursorElement = cursor;

    window.addEventListener(
      'pointermove',
      (event) => {
        cursor.classList.add('is-active');
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
        cursor.classList.toggle(
          'is-hover',
          Boolean(event.target.closest('a, button, .tabi-figure, .page-listing .section-li')),
        );
      },
      { passive: true },
    );

    document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  };

  const maybeCurtain = () => {
    if (curtainCreated || CAPTURE || reducedMotion) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem('tabi-viaggi-visited') === '1';
      window.sessionStorage.setItem('tabi-viaggi-visited', '1');
    } catch {}
    if (seen) return;

    curtainCreated = true;
    const curtain = document.createElement('div');
    curtain.className = 'tabi-curtain';
    curtain.dataset.tabiFixed = '';
    curtain.setAttribute('aria-hidden', 'true');
    const mark = document.createElement('span');
    mark.textContent = '旅';
    curtain.append(mark);
    document.body.append(curtain);
    window.setTimeout(() => curtain.remove(), 1800);
  };

  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const progress = $('.tabi-progress');
    if (progress) progress.style.setProperty('--progress', value.toFixed(4));

    const top = $('.tabi-top');
    if (top) top.classList.toggle('is-visible', window.scrollY > 680);

    updateParallax();
    scrollTicking = false;
  };

  const requestScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScroll);
  };

  const setupPersistentUi = () => {
    ensureSkipLink();
    ensureProgress();
    ensureBackToTop();
    ensureCursor();

    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll, { passive: true });

    document.addEventListener('themechange', () => {
      flashThemeTransition();
      updateThemeUi();
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.darkmode')) return;
      window.setTimeout(() => {
        flashThemeTransition();
        updateThemeUi();
      }, 0);
    });

    maybeCurtain();
    updateScroll();
  };

  /* ------------------------------------------------------------------
     Inizializzazione di pagina (prima visita e ogni nav SPA)
     ------------------------------------------------------------------ */

  const initPage = () => {
    teardownPage();

    const slug = document.body?.dataset.slug || '';
    const hasListing = Boolean($('.page-listing'));
    const type = slug === 'index' ? 'home' : hasListing ? 'listing' : slug.startsWith('tags/') ? 'listing' : 'content';

    root.dataset.tabiPage = type;
    document.body?.classList.toggle('tabi-home', type === 'home');

    ensureBackdrop();
    ensureThemeLabel();

    if (type === 'home') {
      decorateHome();
    } else if (type === 'listing') {
      decorateListing(slug);
    } else {
      decorateContent(slug);
    }

    decorateLocalGuide();
    decorateFigures();
    decorateTables();

    if (type === 'content') {
      const title = $('.article-title');
      const article = $('.center article');
      if (title && article && !$('.tabi-page-meta')) {
        const photos = article.querySelectorAll('.tabi-figure img').length;
        if (photos) {
          addPageMeta(
            title,
            `<span><b>${photos}</b> ${photos === 1 ? 'fotografia' : 'fotografie'}</span>`,
          );
        }
      }
    }

    splitTitle($('.article-title'));
    setupReveal();
    setupMotion();
    updateScroll();
  };

  /* ------------------------------------------------------------------
     Eventi globali
     ------------------------------------------------------------------ */

  document.addEventListener('prenav', () => {
    root.classList.add('tabi-leaving');
    teardownPage();
  });

  document.addEventListener('nav', () => {
    root.classList.remove('tabi-leaving');
    root.classList.add('tabi-entering');
    window.setTimeout(() => root.classList.remove('tabi-entering'), 620);
    initPage();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupPersistentUi();
      initPage();
    });
  } else {
    setupPersistentUi();
    initPage();
  }
})();
