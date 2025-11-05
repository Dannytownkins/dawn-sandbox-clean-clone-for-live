/**
 * Aggressively hide all inventory warnings for POD products
 * Runs on page load and watches for dynamic changes
 */

(() => {
  function hideInventoryWarnings() {
    // Find and hide all inventory warning elements
    const selectors = [
      '.product__inventory',
      '[id*="Inventory"]',
      '[class*="inventory"]',
      '[role="status"].product__inventory'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Check if text contains inventory warnings
        const text = el.textContent.toLowerCase();
        if (text.includes('left') || text.includes('stock') || text.includes('order soon')) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.style.height = '0';
          el.style.overflow = 'hidden';
          el.remove(); // Nuclear option - just remove it
        }
      });
    });

    // Also check for any element with "Only X left" text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToRemove = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.match(/only.*left|order soon/i)) {
        nodesToRemove.push(node.parentElement);
      }
    }

    nodesToRemove.forEach(el => {
      if (el) {
        el.style.display = 'none';
        el.remove();
      }
    });
  }

  // Run immediately
  hideInventoryWarnings();

  // Run after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideInventoryWarnings);
  }

  // Run after full page load
  window.addEventListener('load', hideInventoryWarnings);

  // Watch for dynamic content changes (variant switching)
  const observer = new MutationObserver(hideInventoryWarnings);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Run again after a delay to catch late-loading content
  setTimeout(hideInventoryWarnings, 500);
  setTimeout(hideInventoryWarnings, 1000);
})();

