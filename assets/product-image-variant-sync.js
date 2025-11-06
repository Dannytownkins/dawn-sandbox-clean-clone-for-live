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
    if (!product.media || product.media.length === 0) return;

    // Create a map of media IDs to variants
    // A media can be attached to multiple variants, so we store arrays
    const mediaToVariantMap = new Map();
    
    // First, map by featured_media
    product.variants.forEach(variant => {
      if (variant.featured_media && variant.featured_media.id) {
        const mediaId = variant.featured_media.id;
        if (!mediaToVariantMap.has(mediaId)) {
          mediaToVariantMap.set(mediaId, []);
        }
        mediaToVariantMap.get(mediaId).push(variant);
      }
    });

    // Also check which variants each media is attached to
    // In Shopify, media can be attached to variants via the media's variant_ids
    product.media.forEach(media => {
      if (media.variant_ids && media.variant_ids.length > 0) {
        media.variant_ids.forEach(variantId => {
          const variant = product.variants.find(v => v.id === variantId);
          if (variant) {
            const mediaId = media.id;
            if (!mediaToVariantMap.has(mediaId)) {
              mediaToVariantMap.set(mediaId, []);
            }
            // Avoid duplicates
            const existing = mediaToVariantMap.get(mediaId);
            if (!existing.find(v => v.id === variant.id)) {
              existing.push(variant);
            }
          }
        });
      }
    });

    if (mediaToVariantMap.size === 0) {
      console.log('Image variant sync: No media-to-variant mappings found');
      return;
    }

    // Get section ID from the product form or media gallery
    const mediaGallery = document.querySelector('media-gallery');
    const productInfo = document.querySelector('product-info');
    if (!mediaGallery || !productInfo) {
      console.log('Image variant sync: Missing media-gallery or product-info');
      return;
    }

    const sectionId = productInfo.dataset.section;
    if (!sectionId) {
      console.log('Image variant sync: No section ID found');
      return;
    }

    // Find variant-selects component
    const variantSelects = document.querySelector(`variant-selects[data-section="${sectionId}"]`);
    if (!variantSelects) {
      console.log('Image variant sync: No variant-selects found');
      return;
    }

    // Listen for thumbnail clicks
    const thumbnailButtons = mediaGallery.querySelectorAll('.thumbnail-list__item button.thumbnail');
    
    if (thumbnailButtons.length === 0) {
      console.log('Image variant sync: No thumbnail buttons found');
      return;
    }

    console.log(`Image variant sync: Found ${thumbnailButtons.length} thumbnails, ${mediaToVariantMap.size} media mappings`);
    
    thumbnailButtons.forEach((button, index) => {
      // Remove existing listeners to avoid duplicates
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', function(e) {
        // Get the media ID from the thumbnail's parent data-target attribute
        const thumbnailItem = newButton.closest('.thumbnail-list__item');
        if (!thumbnailItem) return;

        const dataTarget = thumbnailItem.dataset.target;
        if (!dataTarget) {
          console.log('Image variant sync: No data-target found');
          return;
        }

        // Extract media ID from data-target (format: "sectionId-mediaId")
        // The media ID is the last part after splitting by '-'
        const parts = dataTarget.split('-');
        const mediaId = parseInt(parts[parts.length - 1], 10);
        
        console.log(`Image variant sync: Clicked thumbnail, data-target: ${dataTarget}, extracted mediaId: ${mediaId}`);
        
        if (!mediaId) {
          console.log('Image variant sync: Invalid media ID');
          return;
        }

        if (!mediaToVariantMap.has(mediaId)) {
          console.log(`Image variant sync: No variant found for media ID ${mediaId}`);
          return;
        }

        // Find the variant(s) that use this media
        const variants = mediaToVariantMap.get(mediaId);
        
        // If multiple variants use this image, pick the first one
        // (or we could try to match based on currently selected options)
        const variant = variants[0];
        
        console.log(`Image variant sync: Found variant ${variant.id} with options:`, variant.options);

        // Select the variant by setting option values
        selectVariantByOptions(variantSelects, variant, product);
      });
    });
  }

  /**
   * Programmatically select a variant by its option values
   */
  function selectVariantByOptions(variantSelects, variant, product) {
    if (!variantSelects || !variant || !product) {
      console.log('Image variant sync: Missing parameters for selectVariantByOptions');
      return;
    }

    const optionValues = variant.options || [];
    const productOptions = product.options || [];

    console.log('Image variant sync: Selecting variant with options:', optionValues, 'product options:', productOptions);

    // Get all option inputs/selects
    const optionInputs = Array.from(variantSelects.querySelectorAll('select[name^="options"], input[name^="options"]:not([type="hidden"])'));
    
    console.log('Image variant sync: Found option inputs:', optionInputs.length);
    
    // Group inputs by their option index (based on name attribute)
    const inputsByIndex = {};
    optionInputs.forEach(input => {
      const name = input.name || input.getAttribute('name');
      if (!name) return;
      
      // Extract option name from name like "options[Color]" or "options[Size]"
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

    console.log('Image variant sync: Grouped inputs by index:', inputsByIndex);

    // Set each option value
    optionValues.forEach((value, index) => {
      const inputs = inputsByIndex[index];
      if (!inputs || inputs.length === 0) {
        console.log(`Image variant sync: No inputs found for option index ${index} (value: ${value})`);
        return;
      }

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
          
          if (option) {
            console.log(`Image variant sync: Setting SELECT ${input.name} to ${option.value} (was ${input.value})`);
            if (option.value !== input.value) {
              input.value = option.value;
              // Trigger change event to update variant
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } else {
            console.log(`Image variant sync: No option found for value "${value}" in select ${input.name}`);
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
            
            if (matchedRadio) {
              console.log(`Image variant sync: Setting RADIO ${name} to ${matchedRadio.value} (was ${matchedRadio.checked ? 'checked' : 'unchecked'})`);
              if (!matchedRadio.checked) {
                matchedRadio.checked = true;
                matchedRadio.dispatchEvent(new Event('change', { bubbles: true }));
              }
            } else {
              console.log(`Image variant sync: No radio found for value "${value}" with name "${name}"`);
            }
          } else {
            console.log(`Image variant sync: Setting RADIO ${name} to ${radio.value} (was ${radio.checked ? 'checked' : 'unchecked'})`);
            if (!radio.checked) {
              radio.checked = true;
              radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
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
    setTimeout(initImageVariantSync, 500);
  }

  // Also re-initialize if product info is dynamically updated
  document.addEventListener('product-info:loaded', () => {
    setTimeout(initImageVariantSync, 500);
  });
})();

