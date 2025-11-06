/**
 * Sync product image thumbnails with variant selection
 * When a customer clicks a thumbnail image, automatically select the corresponding variant
 */
(function() {
  'use strict';

  function initImageVariantSync() {
    // Get product data from JSON script tag
    const productJsonScript = document.querySelector('script[data-product-json]');
    if (!productJsonScript) return;

    const product = JSON.parse(productJsonScript.textContent);
    if (!product.variants || product.variants.length === 0) return;

    // Create a map of media IDs to variants
    // Format: mediaId -> variant object
    const mediaToVariantMap = new Map();
    
    product.variants.forEach(variant => {
      if (variant.featured_media && variant.featured_media.id) {
        mediaToVariantMap.set(variant.featured_media.id, variant);
      }
    });

    if (mediaToVariantMap.size === 0) return;

    // Get section ID from the product form or media gallery
    const mediaGallery = document.querySelector('media-gallery');
    const productInfo = document.querySelector('product-info');
    if (!mediaGallery || !productInfo) return;

    const sectionId = productInfo.dataset.section;
    if (!sectionId) return;

    // Find variant-selects component
    const variantSelects = document.querySelector(`variant-selects[data-section="${sectionId}"]`);
    if (!variantSelects) return;

    // Listen for thumbnail clicks
    const thumbnailButtons = mediaGallery.querySelectorAll('.thumbnail-list__item button.thumbnail');
    
    thumbnailButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        // Get the media ID from the thumbnail's parent data-target attribute
        const thumbnailItem = button.closest('.thumbnail-list__item');
        if (!thumbnailItem) return;

        const dataTarget = thumbnailItem.dataset.target;
        if (!dataTarget) return;

        // Extract media ID from data-target (format: "sectionId-mediaId")
        // The media ID is the last part after splitting by '-'
        const parts = dataTarget.split('-');
        const mediaId = parseInt(parts[parts.length - 1], 10);
        
        if (!mediaId || !mediaToVariantMap.has(mediaId)) return;

        // Find the variant that uses this media
        const variant = mediaToVariantMap.get(mediaId);

        // Select the variant by setting option values
        selectVariantByOptions(variantSelects, variant, product);
      });
    });
  }

  /**
   * Programmatically select a variant by its option values
   */
  function selectVariantByOptions(variantSelects, variant, product) {
    if (!variantSelects || !variant || !product) return;

    const optionValues = variant.options || [];
    const productOptions = product.options || [];

    // Get all option inputs/selects, grouped by option index
    const optionInputs = Array.from(variantSelects.querySelectorAll('select[name^="options"], input[name^="options"]:not([type="hidden"])'));
    
    // Group inputs by their option index (based on name attribute)
    const inputsByIndex = {};
    optionInputs.forEach(input => {
      const name = input.name || input.getAttribute('name');
      if (!name) return;
      
      // Extract option index from name like "options[Color]" or "options[Size]"
      const match = name.match(/options\[([^\]]+)\]/);
      if (!match) return;
      
      const optionName = match[1];
      const optionIndex = productOptions.findIndex(opt => opt === optionName);
      
      if (optionIndex >= 0 && optionIndex < optionValues.length) {
        if (!inputsByIndex[optionIndex]) {
          inputsByIndex[optionIndex] = [];
        }
        inputsByIndex[optionIndex].push(input);
      }
    });

    // Set each option value
    optionValues.forEach((value, index) => {
      const inputs = inputsByIndex[index];
      if (!inputs || inputs.length === 0) return;

      inputs.forEach(input => {
        if (input.tagName === 'SELECT') {
          // Find and select the option
          const option = Array.from(input.options).find(opt => {
            // Try exact match first
            if (opt.value === value) return true;
            // Try text content match (case-insensitive, trimmed)
            const optText = opt.textContent.trim();
            const valueText = value.trim();
            return optText.toLowerCase() === valueText.toLowerCase() || 
                   optText === valueText ||
                   optText.replace(/\s+/g, ' ') === valueText.replace(/\s+/g, ' ');
          });
          
          if (option && option.value !== input.value) {
            input.value = option.value;
            // Trigger change event to update variant
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else if (input.type === 'radio') {
          // Find and check the radio button
          const name = input.name || input.getAttribute('name');
          const radio = variantSelects.querySelector(
            `input[type="radio"][name="${name}"][value="${value}"]`
          );
          
          if (!radio) {
            // Try case-insensitive match
            const allRadios = variantSelects.querySelectorAll(`input[type="radio"][name="${name}"]`);
            const matchedRadio = Array.from(allRadios).find(r => {
              const rValue = r.value.trim();
              const vValue = value.trim();
              return rValue.toLowerCase() === vValue.toLowerCase() ||
                     rValue === vValue;
            });
            
            if (matchedRadio && !matchedRadio.checked) {
              matchedRadio.checked = true;
              matchedRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } else if (!radio.checked) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageVariantSync);
  } else {
    // Small delay to ensure media-gallery is initialized
    setTimeout(initImageVariantSync, 100);
  }

  // Also re-initialize if product info is dynamically updated
  document.addEventListener('product-info:loaded', () => {
    setTimeout(initImageVariantSync, 100);
  });
})();

