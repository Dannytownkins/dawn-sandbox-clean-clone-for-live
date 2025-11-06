/**
 * Sync product image thumbnails with variant selection
 * When a customer clicks a thumbnail image, automatically select the corresponding variant
 * Works even when Printify controls variant-image associations
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

    // Create a map of media IDs to variants using multiple strategies
    const mediaToVariantMap = new Map();
    
    // Strategy 1: Use featured_media if available
    product.variants.forEach(variant => {
      if (variant.featured_media && variant.featured_media.id) {
        const mediaId = variant.featured_media.id;
        if (!mediaToVariantMap.has(mediaId)) {
          mediaToVariantMap.set(mediaId, []);
        }
        mediaToVariantMap.get(mediaId).push(variant);
      }
    });

    // Strategy 2: Check media.variant_ids (Shopify's built-in associations)
    product.media.forEach(media => {
      if (media.variant_ids && media.variant_ids.length > 0) {
        media.variant_ids.forEach(variantId => {
          const variant = product.variants.find(v => v.id === variantId);
          if (variant) {
            const mediaId = media.id;
            if (!mediaToVariantMap.has(mediaId)) {
              mediaToVariantMap.set(mediaId, []);
            }
            const existing = mediaToVariantMap.get(mediaId);
            if (!existing.find(v => v.id === variant.id)) {
              existing.push(variant);
            }
          }
        });
      }
    });

    // Strategy 3: Match by color name in image alt text, filename, or src
    // Extract color from variant options (usually first option is Color)
    const colorVariants = {};
    product.variants.forEach(variant => {
      if (variant.options && variant.options.length > 0) {
        const color = variant.options[0].toLowerCase().trim();
        if (!colorVariants[color]) {
          colorVariants[color] = [];
        }
        colorVariants[color].push(variant);
      }
    });

    // Try to match images to colors based on alt text, filename, or URL
    product.media.forEach(media => {
      if (media.type !== 'image') return;
      
      const mediaId = media.id;
      const altText = (media.alt || '').toLowerCase();
      const src = (media.src || media.preview?.src || '').toLowerCase();
      const filename = src.split('/').pop().toLowerCase();
      
      // Check if we already have a mapping for this media
      if (mediaToVariantMap.has(mediaId)) return;
      
      // Try to match color names in alt text or filename
      for (const [color, variants] of Object.entries(colorVariants)) {
        const colorMatch = color.toLowerCase();
        if (altText.includes(colorMatch) || 
            filename.includes(colorMatch) ||
            src.includes(colorMatch)) {
          if (!mediaToVariantMap.has(mediaId)) {
            mediaToVariantMap.set(mediaId, []);
          }
          variants.forEach(variant => {
            const existing = mediaToVariantMap.get(mediaId);
            if (!existing.find(v => v.id === variant.id)) {
              existing.push(variant);
            }
          });
          break; // Found a match, move to next image
        }
      }
    });

    // Strategy 4: Position-based matching (if images are in same order as variants)
    // Only use this if no other strategy found matches
    if (mediaToVariantMap.size === 0 && product.media.length === product.variants.length) {
      product.media.forEach((media, index) => {
        if (media.type === 'image' && product.variants[index]) {
          const mediaId = media.id;
          if (!mediaToVariantMap.has(mediaId)) {
            mediaToVariantMap.set(mediaId, []);
          }
          mediaToVariantMap.get(mediaId).push(product.variants[index]);
        }
      });
    }

    if (mediaToVariantMap.size === 0) {
      console.log('Image variant sync: No media-to-variant mappings found. Try attaching images to variants in Shopify admin.');
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

    // Listen for thumbnail clicks - also listen on the main image viewer
    const thumbnailButtons = mediaGallery.querySelectorAll('.thumbnail-list__item button.thumbnail');
    const mainImageItems = mediaGallery.querySelectorAll('.product__media-item[data-media-id]');
    
    const allClickableElements = [...thumbnailButtons, ...mainImageItems];
    
    if (allClickableElements.length === 0) {
      console.log('Image variant sync: No clickable image elements found');
      return;
    }

    console.log(`Image variant sync: Found ${allClickableElements.length} clickable images, ${mediaToVariantMap.size} media mappings`);
    
    // Function to handle image click
    const handleImageClick = function(element, mediaId) {
      if (!mediaId || !mediaToVariantMap.has(mediaId)) {
        console.log(`Image variant sync: No variant found for media ID ${mediaId}`);
        return;
      }

      // Find the variant(s) that use this media
      const variants = mediaToVariantMap.get(mediaId);
      
      // Re-query variant-selects to ensure we have fresh references
      const sectionId = variantSelects.dataset.section;
      const freshVariantSelects = sectionId ? document.querySelector(`variant-selects[data-section="${sectionId}"]`) : variantSelects;
      if (!freshVariantSelects) {
        console.log('Image variant sync: Could not find variant-selects element');
        return;
      }
      
      // If multiple variants use this image, try to match based on currently selected size
      // Otherwise, pick the first one
      let variant = variants[0];
      
      if (variants.length > 1) {
        // Try to find variant that matches currently selected size
        const currentSizeInput = freshVariantSelects.querySelector('input[type="radio"]:checked[name*="Size"], select[name*="Size"]');
        if (currentSizeInput) {
          const currentSize = currentSizeInput.value || currentSizeInput.textContent;
          const matchingVariant = variants.find(v => {
            // Check if variant's size option matches
            return v.options && v.options.length > 1 && 
                   v.options[1].toLowerCase() === currentSize.toLowerCase();
          });
          if (matchingVariant) variant = matchingVariant;
        }
      }
      
      console.log(`Image variant sync: Found variant ${variant.id} with options:`, variant.options);

      // Wait a bit longer to ensure previous variant change has finished and DOM is stable
      setTimeout(() => {
        // Re-query again right before selecting to ensure we have the latest DOM state
        const latestVariantSelects = sectionId ? document.querySelector(`variant-selects[data-section="${sectionId}"]`) : freshVariantSelects;
        if (latestVariantSelects) {
          selectVariantByOptions(latestVariantSelects, variant, product);
        }
      }, 200);
    };

    // Attach listeners to thumbnails using event delegation
    // Use event delegation on the thumbnail list to avoid issues with cloned nodes
    const thumbnailList = mediaGallery.querySelector('.thumbnail-list');
    if (thumbnailList) {
      thumbnailList.addEventListener('click', function(e) {
        // Check if clicked element is a thumbnail button or inside one
        const button = e.target.closest('.thumbnail-list__item button.thumbnail, button.thumbnail');
        if (!button) return;
        
        const thumbnailItem = button.closest('.thumbnail-list__item');
        if (!thumbnailItem) return;

        const dataTarget = thumbnailItem.dataset.target;
        if (!dataTarget) {
          console.log('Image variant sync: No data-target found');
          return;
        }

        // Extract media ID from data-target (format: "sectionId-mediaId")
        const parts = dataTarget.split('-');
        const mediaId = parseInt(parts[parts.length - 1], 10);
        
        console.log(`Image variant sync: Clicked thumbnail, data-target: ${dataTarget}, extracted mediaId: ${mediaId}`);
        
        if (mediaId) {
          handleImageClick(button, mediaId);
        }
      });
    }

    // Also listen for clicks on main image items (for desktop gallery)
    mainImageItems.forEach((item) => {
      const dataMediaId = item.dataset.mediaId;
      if (!dataMediaId) return;
      
      const parts = dataMediaId.split('-');
      const mediaId = parseInt(parts[parts.length - 1], 10);
      
      if (mediaId) {
        // Listen for clicks on the image or its container
        const clickable = item.querySelector('img, button, .product__media-toggle') || item;
        clickable.addEventListener('click', function(e) {
          // Only trigger if clicking directly on image, not on zoom/modal buttons
          if (e.target.closest('.product__media-toggle, modal-opener')) return;
          
          console.log(`Image variant sync: Clicked main image, mediaId: ${mediaId}`);
          handleImageClick(item, mediaId);
        });
      }
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

    // Re-query variant-selects to ensure we have fresh references after DOM updates
    const sectionId = variantSelects.dataset.section;
    const freshVariantSelects = sectionId ? document.querySelector(`variant-selects[data-section="${sectionId}"]`) : variantSelects;
    if (!freshVariantSelects) {
      console.log('Image variant sync: Could not find fresh variant-selects element');
      return;
    }

    // Get all option inputs/selects - handle both "options[...]" and "Color-1", "Size-2" formats
    // Re-query each time to ensure we have fresh DOM references
    const optionInputs = Array.from(freshVariantSelects.querySelectorAll('select[name^="options"], input[name^="options"]:not([type="hidden"]), input[type="radio"], select'));
    
    console.log('Image variant sync: Found option inputs:', optionInputs.length);
    
    // Group inputs by their option index (based on name attribute or option name)
    const inputsByIndex = {};
    optionInputs.forEach(input => {
      const name = (input.name || input.getAttribute('name') || '').trim();
      if (!name) return;
      
      // Try to match "options[Color]" or "options[Size]" format
      let optionName = null;
      let optionIndex = -1;
      
      const optionsMatch = name.match(/options\[([^\]]+)\]/);
      if (optionsMatch) {
        optionName = optionsMatch[1];
        optionIndex = productOptions.findIndex(opt => opt === optionName);
      } else {
        // Try to match "Color-1", "Size-2" format (Dawn theme format)
        // Extract option name from name like "Color-1" or "Size-2"
        const nameMatch = name.match(/^([A-Za-z]+)-\d+/);
        if (nameMatch) {
          optionName = nameMatch[1];
          // Find matching option index by comparing option names
          optionIndex = productOptions.findIndex(opt => {
            const optLower = opt.toLowerCase();
            const nameLower = optionName.toLowerCase();
            return optLower === nameLower || 
                   optLower.includes(nameLower) || 
                   nameLower.includes(optLower);
          });
        }
      }
      
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

      // For radio buttons, find the one with matching value
      // For selects, find the matching option
      const valueTrimmed = value.trim();
      let optionSet = false;
      
      // Use a for loop instead of forEach so we can break properly
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (optionSet) break; // Stop after first match for radio buttons
        
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
            optionSet = true;
          } else {
            console.log(`Image variant sync: No option found for value "${value}" in select ${input.name}`);
          }
        } else if (input.type === 'radio') {
          // Check if this radio button matches the value we want
          const inputValue = (input.value || '').trim();
          const inputName = (input.name || '').trim();
          const valueLower = valueTrimmed.toLowerCase();
          const inputValueLower = inputValue.toLowerCase();
          const matches = inputValueLower === valueLower || inputValue === valueTrimmed;
          
          if (matches) {
            console.log(`Image variant sync: Found matching RADIO ${inputName} with value "${inputValue}" (looking for "${valueTrimmed}", currently ${input.checked ? 'checked' : 'unchecked'})`);
            if (!input.checked) {
              // First uncheck all radios in the same group
              // Iterate through all radios and match by name (handling newline characters)
              const allRadios = freshVariantSelects.querySelectorAll('input[type="radio"]');
              allRadios.forEach(radio => {
                const radioName = (radio.name || '').trim();
                if (radioName === inputName && radio !== input && radio.checked) {
                  radio.checked = false;
                }
              });
              
              // Click the radio button directly to trigger all Shopify handlers
              input.click();
              // Also set checked and dispatch change as backup
              input.checked = true;
              
              // Use a more complete event to trigger Shopify's handlers
              const changeEvent = new Event('change', { bubbles: true, cancelable: true });
              input.dispatchEvent(changeEvent);
              
              const inputEvent = new Event('input', { bubbles: true, cancelable: true });
              input.dispatchEvent(inputEvent);
              
              optionSet = true; // Stop after first match
              break; // Exit the for loop
            } else {
              // Already checked, but still mark as set
              console.log(`Image variant sync: Radio already checked, skipping`);
              optionSet = true;
              break;
            }
          }
        }
      }
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

