<?php
/**
 * Plugin Name: OpenStreetMap Block
 * Description: A WordPress block for displaying OpenStreetMap maps with custom markers and popups
 * Version: 1.0.0
 * Author: Pixeld
 * Author URI: https://www.pixeld.com.au
 * License: GPL v2 or later
 * Text Domain: openstreetmap-block
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OSM_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OSM_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Include the main functions file
require_once OSM_PLUGIN_PATH . 'functions.php';

// Initialize the plugin
function osm_block_init() {
    // Register block script
    wp_register_script(
        'osm-block-editor',
        OSM_PLUGIN_URL . 'build/index.js',
        array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n'),
        '1.0.0'
    );

    // Register block style
    wp_register_style(
        'osm-block-editor-style',
        OSM_PLUGIN_URL . 'build/index.css',
        array(),
        '1.0.0'
    );

    // Register frontend style
    wp_register_style(
        'osm-block-frontend-style',
        OSM_PLUGIN_URL . 'assets/frontend.css',
        array(),
        '1.0.0'
    );

    // Register the block
    register_block_type('openstreetmap/map', array(
        'editor_script' => 'osm-block-editor',
        'editor_style' => 'osm-block-editor-style',
        'style' => 'osm-block-frontend-style',
        'render_callback' => 'osm_block_render_callback',
        'attributes' => array(
            'mapTitle' => array(
                'type' => 'string',
                'default' => ''
            ),
            'markers' => array(
                'type' => 'array',
                'default' => array()
            ),
            'markerIcon' => array(
                'type' => 'object',
                'default' => null
            ),
            'tileUrl' => array(
                'type' => 'string',
                'default' => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ),
            'mapHeight' => array(
                'type' => 'number',
                'default' => 400
            ),
            'allowInnerBlocks' => array(
                'type' => 'boolean',
                'default' => true
            )
        )
    ));
}
add_action('init', 'osm_block_init');

// Enqueue Leaflet scripts and styles
function osm_enqueue_leaflet() {
    wp_enqueue_script(
        'leaflet-js',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        array(),
        '1.9.4',
        true
    );
    
    wp_enqueue_style(
        'leaflet-css',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        array(),
        '1.9.4'
    );
}
add_action('wp_enqueue_scripts', 'osm_enqueue_leaflet');
add_action('enqueue_block_editor_assets', 'osm_enqueue_leaflet');

// Render callback for the block
function osm_block_render_callback($attributes, $content) {
    $map_title = isset($attributes['mapTitle']) ? $attributes['mapTitle'] : '';
    $markers = isset($attributes['markers']) ? $attributes['markers'] : array();
    $marker_icon = isset($attributes['markerIcon']) ? $attributes['markerIcon'] : null;
    $tile_url = isset($attributes['tileUrl']) ? $attributes['tileUrl'] : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    $map_height = isset($attributes['mapHeight']) ? $attributes['mapHeight'] : 400;
    $allow_inner_blocks = isset($attributes['allowInnerBlocks']) ? $attributes['allowInnerBlocks'] : true;

    $attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    if (strpos($tile_url, 'carto.com') !== false || strpos($tile_url, 'cartocdn.com') !== false) {
        $attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    } elseif (strpos($tile_url, 'server.arcgisonline.com') !== false) {
        $attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } elseif (strpos($tile_url, 'opentopomap.org') !== false) {
        $attribution = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
    }
    
    $unique_id = 'osm-map-' . uniqid();
    
    ob_start();
    ?>
    <div class="osm-map-container">
        <?php if (!empty($map_title)): ?>
            <h3 class="osm-map-title"><?php echo esc_html($map_title); ?></h3>
        <?php endif; ?>
        
        <div id="<?php echo esc_attr($unique_id); ?>" class="osm-map" style="height: <?php echo esc_attr($map_height); ?>px; position: relative;"></div>
        
        <?php if ($allow_inner_blocks && !empty($content)): ?>
        <div class="osm-inner-blocks" style="position: absolute; top: 10px; left: 10px; right: 10px; z-index: 1000; pointer-events: none;">
            <div style="pointer-events: auto;">
                <?php echo $content; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof L !== 'undefined') {
                // Initialize map
                var map = L.map('<?php echo esc_js($unique_id); ?>', {
                    zoomControl: false
                }).setView([0, 0], 2);
                
                L.control.zoom({ position: 'bottomright' }).addTo(map);
                
                // Add tile layer
                L.tileLayer('<?php echo esc_js($tile_url); ?>', {
                    attribution: '<?php echo $attribution; ?>'
                }).addTo(map);
                
                // Add markers
                var markers = <?php echo json_encode($markers); ?>;
                var bounds = L.latLngBounds();
                
                <?php if ($marker_icon && isset($marker_icon['url'])): ?>
                var customIcon = L.icon({
                    iconUrl: '<?php echo esc_js($marker_icon['url']); ?>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });
                <?php endif; ?>
                
                markers.forEach(function(marker) {
                    if (marker.lat && marker.lng) {
                        var latLng = [parseFloat(marker.lat), parseFloat(marker.lng)];
                        var popupContent = '';
                        
                        if (marker.address) {
                            popupContent += '<strong>' + marker.address + '</strong><br>';
                        }
                        if (marker.description) {
                            popupContent += marker.description;
                        }
                        
                        var leafletMarker = L.marker(latLng, {
                            <?php if ($marker_icon && isset($marker_icon['url'])): ?>
                            icon: customIcon
                            <?php endif; ?>
                        }).addTo(map);
                        
                        if (popupContent) {
                            leafletMarker.bindPopup(popupContent);
                        }
                        
                        bounds.extend(latLng);
                    }
                });
                
                // Fit map to markers if there are any
                if (markers.length > 0) {
                    map.fitBounds(bounds);
                }
            }
        });
        </script>
    </div>
    <?php
    return ob_get_clean();
} 