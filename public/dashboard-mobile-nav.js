(() => {
  const init = () => {
    const sidebar = document.querySelector('.sidebar');
    const top = document.querySelector('.top');
    if (!sidebar || !top) return;

    const ensureAdminLinks = () => {
      const links = [
        { href: 'admin-activity.html', label: 'Recent Activity' },
        { href: 'admin-newsletter.html', label: 'Newsletter' }
      ];
      const current = (window.location.pathname.split('/').pop() || '').toLowerCase();
      const logout = sidebar.querySelector('#logoutBtn') || Array.from(sidebar.querySelectorAll('a.side-link')).find((a) => String(a.textContent || '').toLowerCase().includes('log out'));
      links.forEach((item) => {
        if (sidebar.querySelector(`a.side-link[href="${item.href}"]`)) return;
        const a = document.createElement('a');
        a.className = `side-link${current === item.href ? ' active' : ''}`;
        a.href = item.href;
        a.textContent = item.label;
        if (logout && logout.parentNode) logout.parentNode.insertBefore(a, logout);
        else sidebar.appendChild(a);
      });
    };
    ensureAdminLinks();

    const topActions = top.querySelector('.top-actions');
    const desktopParent = topActions ? topActions.parentNode : null;
    const desktopNextSibling = topActions ? topActions.nextSibling : null;

    if (!top.querySelector('.mobile-nav-toggle')) {
      const btn = document.createElement('button');
      btn.className = 'mobile-nav-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Open menu');
      btn.innerHTML = '&#9776;';
      top.append(btn);
    }

    let overlay = document.querySelector('.mobile-nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mobile-nav-overlay';
      document.body.appendChild(overlay);
    }

    const btn = top.querySelector('.mobile-nav-toggle');
    let mobileActionsSlot = sidebar.querySelector('.mobile-actions-slot');
    if (!mobileActionsSlot) {
      mobileActionsSlot = document.createElement('div');
      mobileActionsSlot.className = 'mobile-actions-slot';
      const brand = sidebar.querySelector('.brand');
      if (brand && brand.parentNode) {
        if (brand.nextSibling) brand.parentNode.insertBefore(mobileActionsSlot, brand.nextSibling);
        else brand.parentNode.appendChild(mobileActionsSlot);
      } else {
        sidebar.prepend(mobileActionsSlot);
      }
    }

    const closeNav = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-label', 'Open menu');
    };

    const openNav = () => {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      document.body.classList.add('nav-open');
      btn.setAttribute('aria-label', 'Close menu');
    };

    const placeActionsByViewport = () => {
      if (!topActions) return;
      const isMobile = window.matchMedia('(max-width: 980px)').matches;
      if (isMobile) {
        if (topActions.parentNode !== mobileActionsSlot) {
          mobileActionsSlot.appendChild(topActions);
        }
      } else if (desktopParent && topActions.parentNode !== desktopParent) {
        if (desktopNextSibling && desktopNextSibling.parentNode === desktopParent) {
          desktopParent.insertBefore(topActions, desktopNextSibling);
        } else {
          desktopParent.appendChild(topActions);
        }
      }
    };

    btn.addEventListener('click', () => {
      if (sidebar.classList.contains('open')) closeNav();
      else openNav();
    });

    overlay.addEventListener('click', closeNav);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });

    sidebar.querySelectorAll('a.side-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 980px)').matches) closeNav();
      });
    });

    const onResize = () => {
      placeActionsByViewport();
      if (!window.matchMedia('(max-width: 980px)').matches) {
        closeNav();
      }
    };
    placeActionsByViewport();
    window.addEventListener('resize', onResize);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
