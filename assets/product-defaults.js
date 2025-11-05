/**
 * Auto-select default variants for products
 * Sets specific size and color defaults based on product handle
 */

(() => {
  // Wait for page to fully load including all scripts
  window.addEventListener('load', () => {
    setTimeout(setProductDefaults, 100); // Small delay to ensure variant selectors are initialized
  });

  function setProductDefaults() {
    // Get product handle from the product-info element
    const productInfo = document.querySelector('product-info');
    if (!productInfo) return;

    const productHandle = productInfo.dataset.productHandle;
    if (!productHandle) return;

    // Define defaults based on product handle
    const defaults = {
      'sarcastic-tee-everything-is-fine-probably-unisex-jersey': {
        'Color': 'Black',
        'Size': 'L'
      },
      'sun-graphic-unisex-tee-everythings-fine-probably': {
        'Color': 'Natural',
        'Size': 'L'
      }
    };

    const productDefaults = defaults[productHandle];
    if (!productDefaults) return; // No defaults for this product

    console.log('Setting defaults for:', productHandle, productDefaults);

    // Set the defaults
    setVariantOptions(productDefaults);
  }

  function setVariantOptions(defaults) {
    // Find variant-selects component
    const variantSelects = document.querySelector('variant-selects');
    if (!variantSelects) {
      console.log('variant-selects not found');
      return;
    }

    // Find all fieldsets (each represents an option like Color, Size)
    const fieldsets = variantSelects.querySelectorAll('fieldset, .product-form__input');
    
    fieldsets.forEach((fieldset) => {
      // Get the option name from legend or label
      const legend = fieldset.querySelector('legend, label');
      if (!legend) return;
      
      const optionName = legend.textContent.trim().replace(':', '').trim();
      const defaultValue = defaults[optionName];
      
      if (!defaultValue) return;
      
      console.log('Setting option:', optionName, 'to:', defaultValue);

      // Find the input/select for this option
      const inputs = fieldset.querySelectorAll('input[type="radio"], select');
      
      inputs.forEach((input) => {
        if (input.tagName === 'SELECT') {
          // Handle select dropdown
          const option = Array.from(input.options).find(opt => 
            opt.value.trim() === defaultValue
          );
          if (option) {
            input.value = option.value;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Selected dropdown:', defaultValue);
          }
        } else if (input.type === 'radio') {
          // Handle radio button
          if (input.value.trim() === defaultValue) {
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Checked radio:', defaultValue);
          }
        }
      });
    });
  }
})();

