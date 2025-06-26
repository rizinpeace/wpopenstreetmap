# OpenStreetMap Block

Tested up to: 6.5.3
Stable tag: 1.0.0
Contributors: rizinpeace
Requires at least: 5.5
Requires PHP: 7.4

License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A WordPress block plugin for displaying interactive OpenStreetMap maps with custom markers and popups.

## Features

– **Interactive Map Display**: Uses Leaflet.js to render OpenStreetMap tiles
– **Custom Markers**: Add multiple markers with custom coordinates
– **Address Geocoding**: Automatically convert addresses to coordinates using Nominatim
– **Custom Marker Icons**: Upload and use custom marker icons
– **Popup Content**: Display address and description in marker popups
– **Tile Layer Customization**: Choose from preset tile layers or use custom URLs
– **Responsive Design**: Maps adapt to different screen sizes
– **Block Editor Integration**: Full integration with WordPress block editor

## Installation

1. Upload the `openstreetmap` folder to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. The "OpenStreetMap" block will be available in the block editor

## Usage

### Adding a Map Block

1. In the WordPress block editor, click the "+" button to add a new block
2. Search for "OpenStreetMap" and select the block
3. The map will appear in your content with default settings

### Configuring the Map

#### Map Settings
– **Map Title**: Optional title displayed above the map
– **Tile Layer URL**: Choose the map style (default: CartoDB Dark Matter)
– **Map Height**: Set the height of the map in pixels (200-800px)

#### Adding Markers

1. In the block settings sidebar, expand the "Markers" section
2. Click "Add Marker" to create a new marker
3. Fill in the marker details:
   – **Address**: Enter a human-readable address
   – **Latitude**: The latitude coordinate (-90 to 90)
   – **Longitude**: The longitude coordinate (-180 to 180)
   – **Description**: Additional information for the popup

#### Geocoding Addresses

1. Enter an address in the "Address" field
2. Click "Geocode Address" to automatically convert the address to coordinates
3. The latitude and longitude fields will be populated automatically

#### Custom Marker Icons

1. In the "Marker Icon" section, click "Select Marker Icon"
2. Choose an image from your media library or upload a new one
3. The selected icon will be used for all markers on the map

## Tile Layer Presets

The plugin includes several preset tile layers:

– **CartoDB Dark**: Dark theme with subtle colors
– **CartoDB Light**: Light theme with clear contrast
– **OpenStreetMap**: Standard OpenStreetMap tiles
– **Satellite**: Satellite imagery
– **Terrain**: Topographic map with elevation data

## Keyboard Shortcuts

– **Ctrl/Cmd + G**: Geocode the address in the current marker

## Technical Details

### Dependencies

– **Leaflet.js**: For map rendering and interaction
– **Nominatim**: For address geocoding
– **WordPress REST API**: For geocoding requests

### File Structure

“`
openstreetmap/
├── openstreetmap.php          # Main plugin file
├── functions.php              # Helper functions
├── build/
│   ├── index.js              # Block editor JavaScript
│   └── index.css             # Block editor styles
├── assets/
│   ├── admin.js              # Additional admin functionality
│   └── frontend.css          # Frontend styles
└── README.md                 # This file
“`

### Customization

#### Adding Custom Tile Layers

You can add custom tile layers by modifying the `tilePresets` object in `assets/admin.js`:

“`javascript
const tilePresets = {
    'Your Custom Layer': 'https://your-tile-server.com/{z}/{x}/{y}.png',
    // … existing presets
};
“`

#### Customizing Marker Icons

The plugin automatically creates a custom image size `osm-marker-icon` (32x32px) for marker icons. You can modify this in `functions.php`:

“`php
add_image_size('osm-marker-icon', 48, 48, false); // Larger icons
“`

#### Styling Customization

Override the default styles by adding CSS to your theme:

“`css
.osm-map-container {
    /* Your custom styles */
}

.osm-map .leaflet-popup-content {
    /* Custom popup styles */
}
“`

## Browser Support

– Chrome 60+
– Firefox 55+
– Safari 12+
– Edge 79+

## Troubleshooting

### Map Not Loading

1. Check if Leaflet.js is loading properly
2. Verify your internet connection
3. Check browser console for JavaScript errors

### Geocoding Not Working

1. Ensure the address is specific enough
2. Check if the Nominatim service is accessible
3. Verify WordPress REST API is enabled

### Custom Icons Not Displaying

1. Check if the image URL is accessible
2. Verify the image format is supported (PNG, JPG, SVG)
3. Ensure the image is properly uploaded to the media library

## License

This plugin is licensed under the GPL v2 or later.

## Support

For support and feature requests, please create an issue in the plugin repository.

## Changelog

### Version 1.0.0
– Initial release
– Basic map functionality
– Marker support with geocoding
– Custom icon support
– Tile layer customization
– Block editor integration 