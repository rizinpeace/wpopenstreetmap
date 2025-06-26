<?php
/**
 * OpenStreetMap Block Plugin Functions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add custom REST API endpoint for geocoding
 */
function osm_add_geocoding_endpoint() {
    register_rest_route('osm/v1', '/geocode', array(
        'methods' => 'GET',
        'callback' => 'osm_geocode_address',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}
add_action('rest_api_init', 'osm_add_geocoding_endpoint');

/**
 * Geocode an address using Nominatim
 */
function osm_geocode_address($request) {
    $address = sanitize_text_field($request->get_param('address'));
    
    if (empty($address)) {
        return new WP_Error('no_address', 'Address parameter is required', array('status' => 400));
    }
    
    $url = 'https://nominatim.openstreetmap.org/search?format=json&q=' . urlencode($address) . '&limit=1';
    
    $response = wp_remote_get($url, array(
        'timeout' => 15,
        'headers' => array(
            'User-Agent' => 'WordPress OpenStreetMap Plugin'
        )
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('geocoding_failed', 'Failed to geocode address', array('status' => 500));
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (empty($data)) {
        return new WP_Error('no_results', 'No results found for this address', array('status' => 404));
    }
    
    $result = $data[0];
    
    return array(
        'lat' => $result['lat'],
        'lng' => $result['lon'],
        'display_name' => $result['display_name']
    );
}

/**
 * Add custom image sizes for marker icons
 */
function osm_add_image_sizes() {
    add_image_size('osm-marker-icon', 32, 32, false);
}
add_action('after_setup_theme', 'osm_add_image_sizes');

/**
 * Add custom CSS for the map container
 */
function osm_add_custom_styles() {
    ?>
    <style>
        .osm-map-container {
            /*margin: 20px 0;*/
            max-width: unset !important;
        }
        
        .osm-map-title {
            margin-bottom: 10px;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .osm-map {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .osm-marker-preview {
            max-width: 32px;
            max-height: 32px;
            margin-right: 10px;
        }
        
        .osm-marker-list {
            margin: 10px 0;
        }
        
        .osm-marker-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        
        .osm-marker-details {
            flex: 1;
        }
        
        .osm-marker-coordinates {
            font-family: monospace;
            font-size: 0.9em;
            color: #666;
        }
    </style>
    <?php
}
add_action('wp_head', 'osm_add_custom_styles');
add_action('admin_head', 'osm_add_custom_styles');
