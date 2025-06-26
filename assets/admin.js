/**
 * OpenStreetMap Block Admin JavaScript
 */

(function($) {
    'use strict';

    // Initialize when document is ready
    $(document).ready(function() {
        // Add custom functionality for the block editor
        if (typeof wp !== 'undefined' && wp.data && wp.data.subscribe) {
            // Listen for block selection changes
            wp.data.subscribe(function() {
                const selectedBlock = wp.data.select('core/block-editor').getSelectedBlock();
                
                if (selectedBlock && selectedBlock.name === 'openstreetmap/map') {
                    // Add custom classes or functionality when OSM block is selected
                    $('.wp-block-openstreetmap-map').addClass('osm-block-selected');
                } else {
                    $('.osm-block-selected').removeClass('osm-block-selected');
                }
            });
        }

        // Add custom validation for coordinates
        $(document).on('input', '.components-text-control__input[type="number"]', function() {
            const $input = $(this);
            const value = parseFloat($input.val());
            
            // Validate latitude (-90 to 90)
            if ($input.attr('placeholder') && $input.attr('placeholder').includes('Latitude')) {
                if (value < -90 || value > 90) {
                    $input.addClass('invalid-coordinate');
                    if (!$input.next('.coordinate-error').length) {
                        $input.after('<span class="coordinate-error" style="color: #dc3545; font-size: 12px; display: block; margin-top: 4px;">Latitude must be between -90 and 90</span>');
                    }
                } else {
                    $input.removeClass('invalid-coordinate');
                    $input.next('.coordinate-error').remove();
                }
            }
            
            // Validate longitude (-180 to 180)
            if ($input.attr('placeholder') && $input.attr('placeholder').includes('Longitude')) {
                if (value < -180 || value > 180) {
                    $input.addClass('invalid-coordinate');
                    if (!$input.next('.coordinate-error').length) {
                        $input.after('<span class="coordinate-error" style="color: #dc3545; font-size: 12px; display: block; margin-top: 4px;">Longitude must be between -180 and 180</span>');
                    }
                } else {
                    $input.removeClass('invalid-coordinate');
                    $input.next('.coordinate-error').remove();
                }
            }
        });

        // Add keyboard shortcuts for quick coordinate entry
        $(document).on('keydown', '.components-text-control__input', function(e) {
            // Ctrl/Cmd + G to geocode the address in the same marker
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                const $markerItem = $(this).closest('.marker-item, [style*="border: 1px solid #ddd"]');
                const $addressInput = $markerItem.find('input[placeholder*="Address"]');
                const $geocodeButton = $markerItem.find('button:contains("Geocode Address")');
                
                if ($addressInput.val() && $geocodeButton.length) {
                    $geocodeButton.click();
                }
            }
        });

        // Add tooltips for better UX
        $(document).on('mouseenter', '.components-button:contains("Geocode Address")', function() {
            const $button = $(this);
            if (!$button.attr('title')) {
                $button.attr('title', 'Convert address to coordinates automatically (Ctrl+G)');
            }
        });

        // Add custom styling for invalid coordinates
        $('<style>')
            .prop('type', 'text/css')
            .html(`
                .invalid-coordinate {
                    border-color: #dc3545 !important;
                    box-shadow: 0 0 0 1px #dc3545 !important;
                }
                .osm-block-selected {
                    outline: 2px solid #007cba;
                    outline-offset: 2px;
                }
                .coordinate-error {
                    animation: fadeIn 0.3s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `)
            .appendTo('head');

        // Add custom functionality for marker icon preview
        $(document).on('change', 'input[type="file"]', function() {
            const file = this.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const $preview = $('<img>')
                        .attr('src', e.target.result)
                        .css({
                            'max-width': '100px',
                            'max-height': '100px',
                            'margin-top': '10px',
                            'border-radius': '4px',
                            'border': '1px solid #ddd'
                        });
                    
                    const $container = $(this).closest('.components-base-control');
                    $container.find('.icon-preview').remove();
                    $container.append($('<div class="icon-preview"></div>').append($preview));
                }.bind(this);
                reader.readAsDataURL(file);
            }
        });

        // Add custom functionality for tile URL presets
        const tilePresets = {
            'CartoDB Dark': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            'CartoDB Light': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            'OpenStreetMap': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'Satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            'Terrain': 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
        };

        // Add preset selector if it doesn't exist
        if ($('.tile-url-preset').length === 0) {
            const $tileUrlControl = $('.osm-tile-url-control-wrapper');
            if ($tileUrlControl.length) {
                const $presetSelect = $('<select class="tile-url-preset" style="margin-top: 8px; width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">')
                    .append('<option value="">Select a preset tile layer...</option>');
                
                Object.keys(tilePresets).forEach(function(presetName) {
                    $presetSelect.append(`<option value="${tilePresets[presetName]}">${presetName}</option>`);
                });
                
                $tileUrlControl.append($presetSelect);
                
                $presetSelect.on('change', function() {
                    const selectedUrl = $(this).val();
                    if (selectedUrl) {
                        $('.osm-tile-url-control-wrapper input').val(selectedUrl).trigger('input');
                    }
                });
            }
        }

    });

})(jQuery); 