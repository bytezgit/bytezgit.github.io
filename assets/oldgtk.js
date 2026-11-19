(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const statusEl = $('#status');
  const countEl = $('#count');
  const search = $('[data-search]');
  const win = $('.window');
  const tree = $('.tree-pane');
  const splitter = $('.splitter');
  const modal = $('#modal');
  const dialogTitle = $('#dialogTitle');
  const dialogBody = $('#dialogBody');

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const setCount = (text) => {
    if (countEl) countEl.textContent = text;
  };

  const outputEl = $('#output');

  const log = (message) => {
    if (!outputEl) return;
    const line = document.createElement('div');
    const time = document.createElement('span');
    time.className = 'ts';
    time.textContent = new Date().toLocaleTimeString([], { hour12: false });
    line.appendChild(time);
    line.appendChild(document.createTextNode(message));
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
  };

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(message || 'Copied to clipboard');
      log(message || 'Copied to clipboard');
      return true;
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      setStatus(ok ? (message || 'Copied to clipboard') : 'Copy failed');
      log(ok ? (message || 'Copied to clipboard') : 'Copy failed');
      return ok;
    }
  };

  /* ── menus ─────────────────────────────────────────────── */
  const menus = $$('.menu');

  const closeMenus = () => {
    menus.forEach((menu) => {
      menu.classList.remove('open');
      const btn = $('.menu-btn', menu);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  };

  menus.forEach((menu) => {
    const btn = $('.menu-btn', menu);
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      closeMenus();
      if (!isOpen) {
        menu.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    menu.addEventListener('mouseenter', () => {
      if (!menus.some((m) => m.classList.contains('open'))) return;
      closeMenus();
      menu.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu')) closeMenus();
  });

  /* ── dialogs ───────────────────────────────────────────── */
  const appIcon = $('.app-icon');
  const iconSrc = appIcon ? appIcon.getAttribute('src') : '';

  const dialogs = {
    about: {
      title: 'About Bytez Toolkit',
      html: `<img class="dlg-icon" src="${iconSrc}" alt="">
        <div>
          <p><b>Bytez Toolkit</b><br>Version 1.0 &middot; static build</p>
          <p>Portfolio of reverse-engineering tools, memory references, and small web experiments by bytez.</p>
          <p class="tiny muted">Built by hand. No framework, no telemetry.</p>
        </div>`
    },
    shortcuts: {
      title: 'Keyboard shortcuts',
      html: `<div style="width:100%">
        <table class="props">
          <tr><td>/</td><td>Focus search</td></tr>
          <tr><td>Ctrl + F</td><td>Focus search</td></tr>
          <tr><td>Esc</td><td>Clear search / close dialog</td></tr>
          <tr><td>Alt + 1</td><td>Home</td></tr>
          <tr><td>Alt + 2</td><td>Roblox Offsets</td></tr>
          <tr><td>Alt + 3</td><td>Steam DRM-Free .so</td></tr>
        </table>
      </div>`
    }
  };

  let lastFocus = null;

  const openDialog = (type) => {
    const data = dialogs[type];
    if (!data || !modal) return;
    lastFocus = document.activeElement;
    if (dialogTitle) dialogTitle.textContent = data.title;
    if (dialogBody) dialogBody.innerHTML = data.html;
    modal.classList.add('open');
    const ok = $('.dialog-actions .btn', modal);
    if (ok) ok.focus();
  };

  const closeDialog = () => {
    if (!modal) return;
    modal.classList.remove('open');
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDialog();
    });
    $$('[data-dialog-close]', modal).forEach((el) => el.addEventListener('click', closeDialog));
  }

  /* ── clock ─────────────────────────────────────────────── */
  const clock = $('[data-clock]');
  if (clock) {
    const tick = () => {
      clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
      clock.title = 'Local time';
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── tree ──────────────────────────────────────────────── */
  const toggleGroup = (row) => {
    const group = row.dataset.group;
    if (!group) return;
    const open = row.getAttribute('aria-expanded') !== 'false';
    row.setAttribute('aria-expanded', open ? 'false' : 'true');
    const box = $('.tw', row);
    if (box) box.textContent = open ? '+' : '−';
    $$('[data-parent="' + group + '"]', tree).forEach((child) => {
      child.classList.toggle('hidden', open);
    });
  };

  $$('.tree-row', tree).forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.tw') && row.dataset.group) {
        toggleGroup(row);
        return;
      }
      if (row.dataset.group) {
        toggleGroup(row);
        return;
      }
      if (row.dataset.href) {
        if (window.matchMedia('(max-width: 820px)').matches) tree.classList.remove('open');
        window.location.href = row.dataset.href;
      }
    });
  });

  const navToggle = $('[data-nav-toggle]');
  if (navToggle && tree) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = tree.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (window.matchMedia('(max-width: 820px)').matches && tree.classList.contains('open') &&
          !e.target.closest('.tree-pane') && !e.target.closest('[data-nav-toggle]')) {
        tree.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── splitter ──────────────────────────────────────────── */
  if (tree && splitter) {
    const saved = Number(localStorage.getItem('bytez_tree_width'));
    if (saved >= 170 && saved <= 340 && !window.matchMedia('(max-width: 820px)').matches) {
      tree.style.flexBasis = saved + 'px';
      tree.style.width = saved + 'px';
    }

    splitter.addEventListener('pointerdown', (e) => {
      if (window.matchMedia('(max-width: 820px)').matches) return;
      e.preventDefault();
      const startX = e.clientX;
      const startW = tree.getBoundingClientRect().width;
      document.body.classList.add('is-resizing');
      splitter.setPointerCapture(e.pointerId);

      const move = (ev) => {
        const width = Math.max(170, Math.min(340, startW + ev.clientX - startX));
        tree.style.flexBasis = width + 'px';
        tree.style.width = width + 'px';
      };

      const up = () => {
        document.body.classList.remove('is-resizing');
        localStorage.setItem('bytez_tree_width', String(Math.round(tree.getBoundingClientRect().width)));
        splitter.removeEventListener('pointermove', move);
        splitter.removeEventListener('pointerup', up);
      };

      splitter.addEventListener('pointermove', move);
      splitter.addEventListener('pointerup', up);
    });

    splitter.addEventListener('dblclick', () => {
      tree.style.flexBasis = '228px';
      tree.style.width = '228px';
      localStorage.setItem('bytez_tree_width', '228');
    });
  }

  /* ── search + shortcuts ────────────────────────────────── */
  let filterFn = null;

  if (search) {
    search.addEventListener('input', () => {
      if (filterFn) filterFn(search.value.trim().toLowerCase());
      else setStatus(search.value ? 'Searching…' : 'Ready');
    });

    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
        closeDialog();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        search.focus();
        search.select();
        return;
      }
      if (e.key === '/' && !typing) {
        e.preventDefault();
        search.focus();
        search.select();
        return;
      }
      if (e.key === 'Escape' && document.activeElement === search) {
        search.value = '';
        if (filterFn) filterFn('');
        search.blur();
        return;
      }
      if (e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        window.location.href = ['index.html', 'roblox-offsets.html', 'steam-drm-free.html'][Number(e.key) - 1];
      }
    });
  }

  /* ── actions ───────────────────────────────────────────── */
  $$('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const action = el.dataset.action;
      closeMenus();

      if (action === 'find') {
        e.preventDefault();
        if (search) { search.focus(); search.select(); }
      } else if (action === 'copy-link') {
        e.preventDefault();
        copyText(window.location.href, 'Page link copied');
      } else if (action === 'refresh') {
        e.preventDefault();
        window.location.reload();
      } else if (action === 'maximize') {
        e.preventDefault();
        if (win) win.classList.toggle('is-max');
      } else if (action === 'about' || action === 'shortcuts') {
        e.preventDefault();
        openDialog(action);
      }
    });
  });

  window.WF = {
    setStatus,
    setCount,
    copy: copyText,
    log,
    dialog: openDialog,
    set onFilter(fn) { filterFn = fn; },
    get onFilter() { return filterFn; }
  };
})();
