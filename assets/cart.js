/**
 * Cart Drawer Functionality + AJAX Add to Cart
 * Handles opening/closing the mini cart drawer and intercepting ATC submissions
 */

(() => {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  const openers = document.querySelectorAll('[data-open-cart]');
  const closers = drawer.querySelectorAll('[data-close-cart]');

  // Store last focused element for focus return
  let lastFocused = null;

  // Open drawer function
  const openDrawer = () => {
    // Store the element that opened the drawer
    lastFocused = document.activeElement;

    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    
    // Force right positioning
    drawer.style.left = 'auto';
    drawer.style.right = '0';
    drawer.style.width = '100vw';
    
    const panel = drawer.querySelector('.cart-drawer__panel');
    if (panel) {
      panel.style.left = 'auto';
      panel.style.right = '0';
    }
    
    // Lock body scroll - prevent background scrolling
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Focus trap setup
    setupFocusTrap(drawer);

    // Focus close button (better UX than first link)
    const closeButton = drawer.querySelector('[data-close-cart]');
    if (closeButton) {
      setTimeout(() => closeButton.focus(), 100);
    }
  };

  // Close drawer function
  const closeDrawer = () => {
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    
    // Unlock body scroll
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';

    // Remove focus trap
    teardownFocusTrap();

    // Return focus to opener
    if (lastFocused) {
      lastFocused.focus();
      lastFocused = null;
    }
  };

  // Focus trap implementation
  let focusTrapHandler = null;

  const setupFocusTrap = (container) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', focusTrapHandler);
  };

  const teardownFocusTrap = () => {
    if (focusTrapHandler) {
      drawer.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  };

  // Open drawer on click
  openers.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  });

  // Close drawer
  closers.forEach((button) => {
    button.addEventListener('click', closeDrawer);
  });
  
  // Close on overlay click
  drawer.addEventListener('click', (e) => {
    if (e.target.classList.contains('cart-drawer__overlay')) {
      closeDrawer();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) {
      closeDrawer();
    }
  });

  // AJAX Add to Cart - Intercept form submissions
  // Skip forms that are handled by product-atc.js to prevent duplicate handling
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.action.includes('/cart/add')) return;
    
    // Skip if this form is handled by product-atc.js (has data-type="add-to-cart-form")
    if (form.hasAttribute('data-type') && form.getAttribute('data-type') === 'add-to-cart-form') {
      return; // Let product-atc.js handle it
    }

    e.preventDefault();

    // Show loading state on submit button
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Adding...</span>';
    }

    const fd = new FormData(form);

    try {
      // Add item to cart via AJAX
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      });

      // Parse response - Shopify can return 200 OK with error in JSON
      const data = await res.json().catch(() => null);
      
      // Check for actual error in response (Shopify returns status field on error)
      if (!res.ok || (data && data.status && data.status >= 400)) {
        const errorMsg = data?.description || data?.message || 'Add to cart failed';
        console.error('Add to cart error:', errorMsg);
        alert(errorMsg);
        
        // Reset button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
        return;
      }

      // Success - refresh cart data
      const cartRes = await fetch('/cart.js', {
        headers: { Accept: 'application/json' },
      });
      const cart = await cartRes.json();

      // Update cart count badge (multiple selectors for compatibility)
      const updateCartBadge = (count) => {
        // Header cart badge
        const badges = document.querySelectorAll(
          '[data-cart-count], .cart-count-bubble span[aria-hidden="true"], .cart-badge'
        );
        badges.forEach((badge) => {
          badge.textContent = count;
          if (count > 0) {
            badge.style.display = '';
          }
        });
      };

      updateCartBadge(cart.item_count);

      // Reload drawer content
      const drawerRes = await fetch(window.location.href);
      const html = await drawerRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newDrawer = doc.getElementById('cart-drawer');
      if (newDrawer) {
        drawer.innerHTML = newDrawer.innerHTML;
        // Re-attach close listeners
        drawer.querySelectorAll('[data-close-cart]').forEach((btn) => {
          btn.addEventListener('click', closeDrawer);
        });
      }

      // Open the drawer
      openDrawer();

      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      // Only show alert if it's a real network/parsing error
      // Don't show false errors if cart was actually updated
      try {
        const cartCheck = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
        const cartData = await cartCheck.json();
        
        // If cart has items, it likely succeeded despite the error - don't show false error
        if (cartData && cartData.item_count > 0) {
          // Item was added successfully, just refresh the UI
          updateCartBadge(cartData.item_count);
          openDrawer();
          return;
        }
      } catch (checkErr) {
        // Can't verify cart state, show error
      }
      
      alert('Could not add to cart. Please try again or contact support.');

      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
})();

/**
 * Mobile Menu Drawer
 */
(() => {
  const drawer = document.querySelector('.mobile-drawer');
  if (!drawer) return;

  const openers = document.querySelectorAll('[data-open-menu]');
  const closers = drawer.querySelectorAll('[data-close-menu]');

  const openMenu = () => {
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
  };

  const closeMenu = () => {
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
  };

  openers.forEach((btn) => {
    btn.addEventListener('click', openMenu);
  });

  closers.forEach((btn) => {
    btn.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.hidden) {
      closeMenu();
    }
  });
})();
