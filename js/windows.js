if (window.self === window.top) document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const hero = document.querySelector('.hero');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer.peu');

  if (!body.classList.contains('xp-desktop') || !hero || !main || !footer) return;

  const rootWindow = document.createElement('section');
  rootWindow.className = 'root-window';
  hero.before(rootWindow);
  rootWindow.append(hero, main);

  const makeControls = (type) => {
    const controls = document.createElement('div');
    controls.className = 'window-controls';
    controls.setAttribute('aria-label', 'Controls de finestra');
    controls.innerHTML = `
      <button type="button" data-window-action="minimize" aria-label="Minimitzar" title="Minimitzar">_</button>
      <button type="button" data-window-action="maximize" aria-label="Maximitzar" title="Maximitzar">□</button>
      <button type="button" data-window-action="close" aria-label="Tancar" title="Tancar">×</button>
    `;
    if (type === 'floating') controls.classList.add('floating-window-controls');
    return controls;
  };

  const controls = makeControls('main');
  hero.append(controls);

  const legacyContent = document.createElement('div');
  legacyContent.className = 'taskbar-legacy';
  while (footer.firstChild) legacyContent.append(footer.firstChild);

  const taskbarStart = document.createElement('button');
  taskbarStart.className = 'taskbar-start';
  taskbarStart.type = 'button';
  taskbarStart.innerHTML = '<strong>⊞</strong> Inicio';
  taskbarStart.setAttribute('aria-expanded', 'false');

  const taskbarApps = document.createElement('div');
  taskbarApps.className = 'taskbar-apps';

  const taskbarWindow = document.createElement('button');
  taskbarWindow.className = 'taskbar-window is-active';
  taskbarWindow.type = 'button';
  taskbarWindow.textContent = document.title.replace(' - Portada', '');
  taskbarWindow.setAttribute('aria-label', 'Restaurar finestra');

  const clock = document.createElement('time');
  clock.className = 'taskbar-clock';
  footer.append(taskbarStart, taskbarApps, taskbarWindow, clock, legacyContent);

  const menu = document.createElement('div');
  menu.className = 'start-menu';
  menu.hidden = true;
  menu.innerHTML = `
    <div class="start-menu-title">Sistemes Operatius</div>
    <a href="${body.classList.contains('xp-root') ? 'index.html' : '../index.html'}">🏠 Portada</a>
    <a href="${body.classList.contains('xp-root') ? 'sprints.html' : '../sprints.html'}">📁 Índex de sprints</a>
    <a href="https://github.com/judithmartimendez/sistemes_operatius" target="_blank" rel="noopener">💻 Codi a GitHub</a>
  `;
  body.append(menu);

  const selectionBox = document.createElement('div');
  selectionBox.className = 'desktop-selection-box';
  selectionBox.hidden = true;
  body.append(selectionBox);

  const desktopIcons = () => [...document.querySelectorAll('.desktop-icon')];
  let selecting = false;
  let selectionStartX = 0;
  let selectionStartY = 0;

  const updateSelection = (event) => {
    const currentX = event.clientX;
    const currentY = event.clientY;
    const left = Math.min(selectionStartX, currentX);
    const top = Math.min(selectionStartY, currentY);
    const width = Math.abs(currentX - selectionStartX);
    const height = Math.abs(currentY - selectionStartY);
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;

    const selectionRight = left + width;
    const selectionBottom = top + height;
    desktopIcons().forEach((icon) => {
      const iconRect = icon.getBoundingClientRect();
      const intersects = iconRect.left < selectionRight && iconRect.right > left && iconRect.top < selectionBottom && iconRect.bottom > top;
      icon.classList.toggle('is-selected', intersects);
    });
  };

  body.addEventListener('pointerdown', (event) => {
    if (event.target !== body) return;
    selecting = true;
    selectionStartX = event.clientX;
    selectionStartY = event.clientY;
    selectionBox.hidden = false;
    selectionBox.style.left = `${selectionStartX}px`;
    selectionBox.style.top = `${selectionStartY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    desktopIcons().forEach((icon) => icon.classList.remove('is-selected'));
    body.setPointerCapture(event.pointerId);
  });

  body.addEventListener('pointermove', (event) => {
    if (selecting) updateSelection(event);
  });

  body.addEventListener('pointerup', (event) => {
    if (!selecting) return;
    updateSelection(event);
    selecting = false;
    selectionBox.hidden = true;
  });

  const updateClock = () => {
    clock.textContent = new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  const restoreMainWindow = () => {
    body.classList.remove('window-minimized', 'window-closed');
    taskbarWindow.classList.add('is-active');
  };

  taskbarStart.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    taskbarStart.setAttribute('aria-expanded', String(!menu.hidden));
  });

  taskbarWindow.addEventListener('click', restoreMainWindow);

  const addDrag = (bar, target) => {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    const isMainWindow = target === body || target.classList.contains('root-window');
    const xProperty = isMainWindow ? '--window-x' : '--drag-x';
    const yProperty = isMainWindow ? '--window-y' : '--drag-y';

    bar.addEventListener('pointerdown', (event) => {
      if (event.target.closest('a, button, .resize-handle')) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      originX = parseFloat(target.style.getPropertyValue(xProperty)) || 0;
      originY = parseFloat(target.style.getPropertyValue(yProperty)) || 0;
      const baseTop = bar.getBoundingClientRect().top - originY;
      target.dataset.dragMinY = String(isMainWindow ? 0 : -baseTop);
      bar.classList.add('is-dragging');
      if (target.classList.contains('root-window')) target.classList.add('is-dragging');
      body.classList.add('dragging-window');
      bar.setPointerCapture(event.pointerId);
    });

    bar.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const nextX = originX + event.clientX - startX;
      const nextY = Math.max(Number(target.dataset.dragMinY), originY + event.clientY - startY);
      target.style.setProperty(xProperty, `${nextX}px`);
      target.style.setProperty(yProperty, `${nextY}px`);
    });

    bar.addEventListener('pointerup', () => {
      dragging = false;
      bar.classList.remove('is-dragging');
      if (target.classList.contains('root-window')) target.classList.remove('is-dragging');
      body.classList.remove('dragging-window');
    });
  };

  const addResize = (windowElement) => {
    const directions = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
    directions.forEach((direction) => {
      const handle = document.createElement('span');
      handle.className = `resize-handle resize-${direction}`;
      handle.dataset.resizeDirection = direction;
      handle.setAttribute('aria-hidden', 'true');
      windowElement.append(handle);
    });

    windowElement.addEventListener('pointerdown', (event) => {
      const handle = event.target.closest('.resize-handle');
      if (!handle) return;

      event.preventDefault();
      event.stopPropagation();
      const direction = handle.dataset.resizeDirection;
      const startRect = windowElement.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const minWidth = 360;
      const minHeight = 220;
      windowElement.style.transform = 'none';
      windowElement.style.left = `${startRect.left}px`;
      windowElement.style.top = `${startRect.top}px`;
      windowElement.style.width = `${startRect.width}px`;
      windowElement.style.height = `${startRect.height}px`;
      windowElement.style.setProperty('--drag-x', '0px');
      windowElement.style.setProperty('--drag-y', '0px');
      windowElement.setPointerCapture(event.pointerId);

      const resize = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        let width = startRect.width;
        let height = startRect.height;
        let left = startRect.left;
        let top = startRect.top;

        if (direction.includes('e')) width = Math.max(minWidth, startRect.width + deltaX);
        if (direction.includes('s')) height = Math.max(minHeight, startRect.height + deltaY);
        if (direction.includes('w')) {
          width = Math.max(minWidth, startRect.width - deltaX);
          left = startRect.right - width;
        }
        if (direction.includes('n')) {
          height = Math.max(minHeight, startRect.height - deltaY);
          top = startRect.bottom - height;
        }

        windowElement.style.left = `${Math.max(0, left)}px`;
        windowElement.style.top = `${Math.max(0, top)}px`;
        windowElement.style.width = `${Math.min(width, window.innerWidth - Math.max(0, left))}px`;
        windowElement.style.height = `${Math.min(height, window.innerHeight - 44 - Math.max(0, top))}px`;
      };

      const finishResize = () => {
        windowElement.removeEventListener('pointermove', resize);
        windowElement.removeEventListener('pointerup', finishResize);
      };

      windowElement.addEventListener('pointermove', resize);
      windowElement.addEventListener('pointerup', finishResize);
    });
  };

  addDrag(rootWindow, rootWindow);

  const addRootResize = () => {
    ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'].forEach((direction) => {
      const handle = document.createElement('span');
      handle.className = `resize-handle resize-${direction}`;
      handle.dataset.resizeDirection = direction;
      handle.setAttribute('aria-hidden', 'true');
      rootWindow.append(handle);
    });

    rootWindow.addEventListener('pointerdown', (event) => {
      const handle = event.target.closest('.resize-handle');
      if (!handle) return;
      event.preventDefault();
      event.stopPropagation();

      const direction = handle.dataset.resizeDirection;
      const windowRect = rootWindow.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = windowRect.width;
      const startHeight = windowRect.height;
      const startLeft = windowRect.left;
      const startTop = windowRect.top;
      const minWidth = 360;
      const minMainHeight = 220;
      rootWindow.style.maxWidth = 'none';
      rootWindow.setPointerCapture(event.pointerId);

      const resizeRoot = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        let width = startWidth;
        let height = startHeight;
        let left = startLeft;
        let top = startTop;

        if (direction.includes('e')) width = Math.max(minWidth, startWidth + deltaX);
        if (direction.includes('s')) height = Math.max(minMainHeight, startHeight + deltaY);
        if (direction.includes('w')) {
          width = Math.max(minWidth, startWidth - deltaX);
          left = Math.max(0, startLeft + deltaX);
        }
        if (direction.includes('n')) {
          height = Math.max(minMainHeight, startHeight - deltaY);
          top = Math.max(0, startTop + deltaY);
        }

        rootWindow.style.marginLeft = `${left}px`;
        rootWindow.style.top = `${top}px`;
        rootWindow.style.width = `${Math.min(width, window.innerWidth - left)}px`;
        rootWindow.style.height = `${Math.min(height, window.innerHeight - 44 - top)}px`;
      };

      const finishRootResize = () => {
        rootWindow.removeEventListener('pointermove', resizeRoot);
        rootWindow.removeEventListener('pointerup', finishRootResize);
      };

      rootWindow.addEventListener('pointermove', resizeRoot);
      rootWindow.addEventListener('pointerup', finishRootResize);
    });
  };

  addRootResize();

  controls.addEventListener('click', (event) => {
    const action = event.target.closest('[data-window-action]')?.dataset.windowAction;
    if (!action) return;
    if (action === 'minimize') {
      body.classList.add('window-minimized');
      taskbarWindow.classList.remove('is-active');
    }
    if (action === 'maximize') {
      body.classList.toggle('window-maximized');
      body.style.setProperty('--window-x', '0px');
      body.style.setProperty('--window-y', '0px');
    }
    if (action === 'close') {
      body.classList.add('window-closed');
      taskbarWindow.classList.remove('is-active');
    }
  });

  const floatingWindows = new Map();
  let nextZIndex = 6;

  const focusWindow = (windowElement, taskbarButton) => {
    windowElement.hidden = false;
    windowElement.style.zIndex = String(++nextZIndex);
    windowElement.classList.remove('is-minimized');
    taskbarButton.classList.add('is-active');
  };

  const attachFrameLinks = (frame, windowElement, titlebar, taskbarButton) => {
    frame.addEventListener('load', () => {
      const frameDocument = frame.contentDocument;
      if (!frameDocument) return;

      const pageTitle = frameDocument.title.replace(' - Portada', '').replace('Sprint ', 'Sprint ');
      titlebar.querySelector('.floating-window-title').textContent = pageTitle || 'Finestra';
      taskbarButton.textContent = pageTitle || 'Finestra';

      const cleanStyle = frameDocument.createElement('style');
      cleanStyle.textContent = `
        html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #fff !important; user-select: none !important; }
        .desktop-icons, .hero, footer, script { display: none !important; }
        main { width: 100% !important; height: 100% !important; max-width: none !important; max-height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: auto !important; transform: none !important; background: #fff !important; }
        .panell { min-height: 100% !important; margin: 0 !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 22px !important; opacity: 1 !important; transform: none !important; }
        .apartat, .targeta, .consell, .fitxa-alumne, .bloc-llicencia { opacity: 1 !important; transform: none !important; }
      `;
      frameDocument.head.append(cleanStyle);
      frame.style.visibility = 'visible';

      frameDocument.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || link.target === '_blank' || link.getAttribute('href')?.startsWith('#')) return;
        const target = new URL(link.href, frame.src);
        if (target.origin !== window.location.origin) return;
        event.preventDefault();
        openAppWindow(target.href);
      });
    });
  };

  const openAppWindow = (url) => {
    const target = new URL(url, window.location.href);
    const current = new URL(window.location.href);
    if (target.pathname === current.pathname) {
      restoreMainWindow();
      return;
    }

    const key = target.pathname;
    if (floatingWindows.has(key)) {
      focusWindow(floatingWindows.get(key).element, floatingWindows.get(key).taskbar);
      return;
    }

    const windowElement = document.createElement('section');
    windowElement.className = 'floating-window';
    windowElement.style.setProperty('--drag-x', '0px');
    windowElement.style.setProperty('--drag-y', '0px');
    windowElement.style.zIndex = String(++nextZIndex);
    windowElement.innerHTML = `
      <header class="floating-titlebar">
        <span class="floating-window-title">Obrint finestra...</span>
      </header>
      <iframe title="Contingut de la finestra" src="${target.href}" style="visibility: hidden"></iframe>
    `;
    const titlebar = windowElement.querySelector('.floating-titlebar');
    const frame = windowElement.querySelector('iframe');
    const floatingControls = makeControls('floating');
    titlebar.append(floatingControls);
    body.append(windowElement);

    const centerFloatingWindow = () => {
      if (windowElement.classList.contains('is-maximized')) return;
      if (window.innerWidth < 1000) return;
      const usableLeft = 185;
      const usableWidth = window.innerWidth - usableLeft;
      const windowWidth = windowElement.getBoundingClientRect().width;
      const centeredLeft = usableLeft + (usableWidth - windowWidth) / 2;
      windowElement.style.left = `${centeredLeft}px`;
      windowElement.style.transform = 'translate(var(--drag-x, 0px), var(--drag-y, 0px))';
    };

    centerFloatingWindow();
    window.addEventListener('resize', centerFloatingWindow);

    const taskbarButton = document.createElement('button');
    taskbarButton.className = 'taskbar-window is-active';
    taskbarButton.type = 'button';
    taskbarButton.textContent = 'Obrint finestra...';
    taskbarApps.append(taskbarButton);

    const state = { element: windowElement, taskbar: taskbarButton };
    floatingWindows.set(key, state);
    addDrag(titlebar, windowElement);
    addResize(windowElement);
    attachFrameLinks(frame, windowElement, titlebar, taskbarButton);

    taskbarButton.addEventListener('click', () => focusWindow(windowElement, taskbarButton));
    floatingControls.addEventListener('click', (event) => {
      const action = event.target.closest('[data-window-action]')?.dataset.windowAction;
      if (action === 'minimize') {
        windowElement.classList.add('is-minimized');
        taskbarButton.classList.remove('is-active');
      }
      if (action === 'maximize') windowElement.classList.toggle('is-maximized');
      if (action === 'close') {
        windowElement.remove();
        taskbarButton.remove();
        floatingWindows.delete(key);
      }
    });
  };

  window.openAppWindow = openAppWindow;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || link.target === '_blank' || link.getAttribute('href')?.startsWith('#')) return;
    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) return;
    event.preventDefault();
    openAppWindow(target.href);
  });
});
