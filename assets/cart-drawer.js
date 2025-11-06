/**
 * Cart Drawer Functionality
 * Handles opening/closing, refreshing content, and cart badge updates
 */

window.CartDrawer = {
  drawer: null,
  isOpen: false,

  init() {
    this.drawer = document.getElementById('cart-drawer');
    if (!this.drawer) return;

    this.setupEventListeners();
    this.enforceRightPositioning();
    this.refresh();
    
    // Watch for drawer visibility changes to re-apply positioning
    const observer = new MutationObserver(() => {
      if (!this.drawer.hasAttribute('hidden')) {
        setTimeout(() => this.enforceRightPositioning(), 0);
      }
    });
    observer.observe(this.drawer, { attributes: true, attributeFilter: ['hidden'] });
  },

  setupEventListeners() {
    // Open drawer triggers
    document.addEventListener('click', e => {
      if (e.target.closest('[data-open-cart-drawer]') || e.target.closest('[data-open-cart]')) {
        e.preventDefault();
        this.open();
      }
    });

    // Close drawer triggers
    this.drawer.addEventListener('click', e => {
      if (e.target.closest('[data-close-cart]') || e.target === this.drawer.querySelector('.cart-drawer__overlay')) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Listen for add to cart events - wait for Shopify to update, then refresh
    window.addEventListener('danliora_add_to_cart', async () => {
      // Wait 300ms for Shopify backend to update
      await new Promise(resolve => setTimeout(resolve, 300));
      await this.refresh();
      this.open();
    });

    // Also listen for Dawn's standard cart refresh event
    document.documentElement.addEventListener('cart:refresh', async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await this.refresh();
      this.open();
    });
  },

  open() {
    if (!this.drawer) return;

    this.drawer.hidden = false;
    this.drawer.setAttribute('aria-hidden', 'false');
    this.isOpen = true;

    // Force right positioning with !important inline styles
    this.drawer.style.setProperty('left', 'auto', 'important');
    this.drawer.style.setProperty('right', '0', 'important');
    this.drawer.style.setProperty('width', '100vw', 'important');
    this.drawer.style.setProperty('margin-left', '0', 'important');
    this.drawer.style.setProperty('margin-right', '0', 'important');
    
    const panel = this.drawer.querySelector('.cart-drawer__panel');
    if (panel) {
      panel.style.setProperty('left', 'auto', 'important');
      panel.style.setProperty('right', '0', 'important');
    }

    // Focus management
    const closeBtn = this.drawer.querySelector('[data-close-cart]');
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 100);
    }

    // Prevent page scroll and ensure top stacking
    document.documentElement.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.drawer) return;

    this.drawer.hidden = true;
    this.drawer.setAttribute('aria-hidden', 'true');
    this.isOpen = false;

    // Restore page scroll
    document.documentElement.classList.remove('cart-open');
    document.body.style.overflow = '';
  },

  async refresh() {
    if (!this.drawer) return;

    // Don't refresh if already refreshing
    if (this._refreshing) return;
    this._refreshing = true;

    try {
      // Fetch fresh cart HTML from the cart-drawer section with cache-busting
      const timestamp = Date.now();
      const response = await fetch(`/?sections=cart-drawer&t=${timestamp}`, {
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch cart');

      const data = await response.json();
      const cartDrawerHtml = data['cart-drawer'];

      if (cartDrawerHtml) {
        // Create temporary container to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = cartDrawerHtml;

        // Extract and replace the ENTIRE drawer content
        const newDrawerInner = temp.querySelector('.cart-drawer');
        const currentDrawerInner = this.drawer.querySelector('.cart-drawer');

        if (newDrawerInner && currentDrawerInner) {
          // Replace entire inner content to ensure everything updates
          currentDrawerInner.innerHTML = newDrawerInner.innerHTML;
        } else {
          // Fallback: just update body
          const newBody = temp.querySelector('.cart-drawer__body');
          const currentBody = this.drawer.querySelector('.cart-drawer__body');
          if (newBody && currentBody) {
            currentBody.innerHTML = newBody.innerHTML;
          }
        }
        
        // Re-apply right positioning after content refresh
        this.enforceRightPositioning();
      }

      // Update cart badge
      await this.updateCartBadge();
    } catch (error) {
      console.error('Cart refresh error:', error);
      // If fetch fails, force reload as last resort
      location.reload();
    } finally {
      this._refreshing = false;
    }
  },

  async updateCartBadge() {
    try {
      const response = await fetch('/cart.js', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch cart data');

      const cart = await response.json();
      const badges = document.querySelectorAll('[data-cart-count]');

      badges.forEach(badge => {
        badge.textContent = cart.item_count;
        badge.style.display = cart.item_count > 0 ? '' : 'none';
      });
    } catch (error) {
      console.error('Cart badge update error:', error);
    }
  },

  enforceRightPositioning() {
    if (!this.drawer) return;
    
    // Force drawer container to right with direct style assignment (works better than setProperty)
    this.drawer.style.left = 'auto';
    this.drawer.style.right = '0';
    this.drawer.style.width = '100vw';
    this.drawer.style.marginLeft = '0';
    this.drawer.style.marginRight = '0';
    this.drawer.style.maxWidth = 'none';
    this.drawer.style.minWidth = '100vw';
    this.drawer.style.display = 'block';
    
    const panel = this.drawer.querySelector('.cart-drawer__panel');
    if (panel) {
      panel.style.left = 'auto';
      panel.style.right = '0';
    }
  },
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CartDrawer.init());
} else {
  CartDrawer.init();
}
