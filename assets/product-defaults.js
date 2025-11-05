/**
 * Auto-select default variants for products
 * Sets specific size and color defaults based on product handle
 */

(() => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setProductDefaults);
  } else {
    setProductDefaults();
  }

  function setProductDefaults() {
    // Get product handle from the product-info element
    const productInfo = document.querySelector('product-info');
    if (!productInfo) return;

    const productHandle = productInfo.dataset.productHandle;
    if (!productHandle) return;

    // Define defaults based on product handle
    const defaults = {
      'sarcastic-tee-everything-is-fine-probably-unisex-jersey': {
        color: 'Black',
        size: 'L'
      },
      'sun-graphic-unisex-tee-everythings-fine-probably': {
        color: 'Natural',
        size: 'L'
      }
    };

    const productDefaults = defaults[productHandle];
    if (!productDefaults) return; // No defaults for this product

    // Set the defaults
    setVariantOptions(productDefaults);
  }

  function setVariantOptions(defaults) {
    // Find all variant option inputs/selects
    const form = document.querySelector('form[data-type="add-to-cart-form"]');
    if (!form) return;

    // Handle both radio buttons and select dropdowns
    const optionInputs = form.querySelectorAll('input[name^="options"], select[name^="options"]');
    
    optionInputs.forEach((input) => {
      const optionName = input.closest('fieldset, .product-form__input')?.querySelector('legend, label')?.textContent?.trim()?.toLowerCase();
      
      if (!optionName) return;

      // Check if this option matches one of our defaults
      if (optionName.includes('color') || optionName.includes('colour')) {
        selectOption(input, defaults.color);
      } else if (optionName.includes('size')) {
        selectOption(input, defaults.size);
      }
    });
  }

  function selectOption(input, value) {
    if (!value) return;

    if (input.tagName === 'SELECT') {
      // Handle select dropdowns
      const option = Array.from(input.options).find(opt => 
        opt.value.toLowerCase() === value.toLowerCase()
      );
      if (option) {
        input.value = option.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (input.type === 'radio') {
      // Handle radio buttons
      if (input.value.toLowerCase() === value.toLowerCase()) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
})();

