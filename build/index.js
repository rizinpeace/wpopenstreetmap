const { registerBlockType } = wp.blocks;
const { createElement: el, useState, useEffect, useRef } = wp.element;
const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck, InnerBlocks } = wp.blockEditor;
const { PanelBody, TextControl, Button, TextareaControl, RangeControl, Notice, SelectControl } = wp.components;
const { __ } = wp.i18n;

// Leaflet map instance for editor
let editorMap = null;
let editorMarkers = [];

registerBlockType('openstreetmap/map', {
    title: __('OpenStreetMap', 'openstreetmap-block'),
    description: __('Display an interactive OpenStreetMap with custom markers and popups.', 'openstreetmap-block'),
    category: 'widgets',
    icon: 'location',
    supports: {
        html: false,
        align: ['wide', 'full'],
        anchor: true,
        customClassName: true,
        inserter: true,
        spacing: {
            margin: true,
            padding: true,
        },
    },
    attributes: {
        mapTitle: {
            type: 'string',
            default: ''
        },
        markers: {
            type: 'array',
            default: []
        },
        markerIcon: {
            type: 'object',
            default: null
        },
        tileUrl: {
            type: 'string',
            default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        },
        mapHeight: {
            type: 'number',
            default: 400
        },
        allowInnerBlocks: {
            type: 'boolean',
            default: true
        }
    },

    edit: function(props) {
        const { attributes, setAttributes } = props;
        const { mapTitle, markers, markerIcon, tileUrl, mapHeight, allowInnerBlocks } = attributes;
        const mapContainerRef = useRef(null);
        const mapInstanceRef = useRef(null);
        const tileLayerRef = useRef(null);
        const markersRef = useRef([]);
        const [geocodingError, setGeocodingError] = useState('');
        const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(0);

        const tileLayerOptions = [
            { label: 'Standard', value: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
            { label: 'CARTO Light', value: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
            { label: 'CARTO Dark', value: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
            { label: 'Esri Satellite', value: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
            { label: 'OpenTopoMap', value: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' }
        ];

        const getAttribution = (url) => {
            if (url.includes('carto.com') || url.includes('cartocdn.com')) {
                return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
            }
            if (url.includes('server.arcgisonline.com')) {
                return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
            }
            if (url.includes('opentopomap.org')) {
                return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
            }
            return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        };

        useEffect(() => {
            if (markers.length > 0 && selectedMarkerIndex >= markers.length) {
                setSelectedMarkerIndex(markers.length - 1);
            }
        }, [markers.length]);

        useEffect(() => {
            if (mapContainerRef.current && !mapInstanceRef.current && typeof L !== 'undefined') {
                mapInstanceRef.current = L.map(mapContainerRef.current, {
                    attributionControl: false,
                    zoomControl: false
                }).setView([0, 0], 2);
                L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
                L.control.attribution({ prefix: false }).addTo(mapInstanceRef.current);
            }
            
            return () => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                    tileLayerRef.current = null;
                    markersRef.current = [];
                }
            };
        }, []);

        useEffect(() => {
            const map = mapInstanceRef.current;
            if (!map) return;

            if (tileLayerRef.current) {
                map.removeLayer(tileLayerRef.current);
            }
            tileLayerRef.current = L.tileLayer(tileUrl, {
                attribution: getAttribution(tileUrl)
            }).addTo(map);

            map.getContainer().style.height = `${mapHeight}px`;
            map.invalidateSize();

            markersRef.current.forEach(marker => map.removeLayer(marker));
            markersRef.current = [];

            const bounds = L.latLngBounds();
            let hasValidMarkers = false;
            
            markers.forEach((marker) => {
                if (marker.lat && marker.lng) {
                    const latLng = [parseFloat(marker.lat), parseFloat(marker.lng)];
                    
                    let iconOptions = {};
                    if (markerIcon && markerIcon.url) {
                        iconOptions.icon = L.icon({
                            iconUrl: markerIcon.url,
                            iconSize: [32, 32],
                            iconAnchor: [16, 32],
                            popupAnchor: [0, -32]
                        });
                    }

                    const leafletMarker = L.marker(latLng, iconOptions).addTo(map);
                    
                    let popupContent = '';
                    if (marker.address) popupContent += `<strong>${marker.address}</strong><br>`;
                    if (marker.description) popupContent += marker.description;
                    if (popupContent) leafletMarker.bindPopup(popupContent);

                    markersRef.current.push(leafletMarker);
                    bounds.extend(latLng);
                    hasValidMarkers = true;
                }
            });

            if (hasValidMarkers) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }

        }, [markers, markerIcon, tileUrl, mapHeight]);

        const addMarker = () => {
            const newMarkers = [...markers, { lat: '', lng: '', address: '', description: '' }];
            setAttributes({ markers: newMarkers });
            setSelectedMarkerIndex(newMarkers.length - 1);
        };

        const updateMarker = (index, field, value) => {
            const updatedMarkers = [...markers];
            updatedMarkers[index][field] = value;
            setAttributes({ markers: updatedMarkers });
        };

        const removeMarker = (index) => {
            const updatedMarkers = markers.filter((_, i) => i !== index);
            setAttributes({ markers: updatedMarkers });
        };

        const geocodeAddress = async (index) => {
            const marker = markers[index];
            if (!marker.address) return;

            setGeocodingError('');
            try {
                const response = await wp.apiFetch({ path: `/osm/v1/geocode?address=${encodeURIComponent(marker.address)}` });
                const updatedMarkers = [...markers];
                updatedMarkers[index].lat = response.lat;
                updatedMarkers[index].lng = response.lng;
                setAttributes({ markers: updatedMarkers });
            } catch (error) {
                const message = error.message || 'Failed to geocode address. Please check the address and try again.';
                setGeocodingError(message);
            }
        };

        const onSelectMarkerIcon = (media) => {
            setAttributes({ markerIcon: { id: media.id, url: media.url, alt: media.alt } });
        };

        const removeMarkerIcon = () => {
            setAttributes({ markerIcon: null });
        };

        return el('div', useBlockProps(),
            el(InspectorControls, {},
                el(PanelBody, { title: __('Map Settings', 'openstreetmap-block'), initialOpen: true },
                    el(TextControl, {
                        label: __('Map Title', 'openstreetmap-block'),
                        value: mapTitle,
                        onChange: (value) => setAttributes({ mapTitle: value }),
                        placeholder: __('Enter map title...', 'openstreetmap-block')
                    }),
                    el(SelectControl, {
                        label: __('Tile Layer', 'openstreetmap-block'),
                        value: tileUrl,
                        options: tileLayerOptions,
                        onChange: (value) => setAttributes({ tileUrl: value }),
                    }),
                    el(RangeControl, {
                        label: __('Map Height (px)', 'openstreetmap-block'),
                        value: mapHeight,
                        onChange: (value) => setAttributes({ mapHeight: value }),
                        min: 200,
                        max: 800,
                        step: 10
                    })
                ),
                el(PanelBody, { title: __('Marker Icon', 'openstreetmap-block'), initialOpen: false },
                    el(MediaUploadCheck, {},
                        el(MediaUpload, {
                            onSelect: onSelectMarkerIcon,
                            allowedTypes: ['image'],
                            value: markerIcon ? markerIcon.id : null,
                            render: ({ open }) => el('div', {},
                                markerIcon ? el('div', {},
                                    el('img', {
                                        src: markerIcon.url,
                                        alt: markerIcon.alt,
                                        style: { maxWidth: '100px', height: 'auto', marginBottom: '10px' }
                                    }),
                                    el(Button, {
                                        isDestructive: true,
                                        onClick: removeMarkerIcon
                                    }, __('Remove Icon', 'openstreetmap-block'))
                                ) : el(Button, {
                                    isPrimary: true,
                                    onClick: open
                                }, __('Select Marker Icon', 'openstreetmap-block'))
                            )
                        })
                    )
                ),
                el(PanelBody, { title: `${__('Marker Manager', 'openstreetmap-block')} (${markers.length})`, initialOpen: true },
                    el('div', {
                            style: {
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '16px',
                            },
                        },
                        markers.map((_, index) =>
                            el(Button, {
                                key: index,
                                isPrimary: index === selectedMarkerIndex,
                                isSecondary: index !== selectedMarkerIndex,
                                isSmall: true,
                                onClick: () => setSelectedMarkerIndex(index),
                                style: { minWidth: '36px' }
                            }, index + 1)
                        ),
                        el(Button, {
                            icon: 'plus-alt2',
                            isPrimary: true,
                            isSmall: true,
                            'aria-label': __('Add Marker', 'openstreetmap-block'),
                            onClick: addMarker,
                        })
                    ),

                    markers.length > 0 && el('div', { key: selectedMarkerIndex },
                        el('div', {
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid #e0e0e0',
                                    paddingBottom: '8px',
                                },
                            },
                            el('h4', { style: { margin: 0 } }, `${__('Marker', 'openstreetmap-block')} ${selectedMarkerIndex + 1} of ${markers.length}`),
                            el(Button, {
                                icon: 'trash',
                                isDestructive: true,
                                isSmall: true,
                                'aria-label': __('Remove this marker', 'openstreetmap-block'),
                                onClick: () => removeMarker(selectedMarkerIndex),
                            })
                        ),
                        el('div', {},
                            el(TextControl, {
                                label: __('Address', 'openstreetmap-block'),
                                value: markers[selectedMarkerIndex]?.address || '',
                                onChange: (value) => updateMarker(selectedMarkerIndex, 'address', value),
                            }),
                            el(Button, {
                                isSecondary: true,
                                onClick: () => geocodeAddress(selectedMarkerIndex),
                                disabled: !markers[selectedMarkerIndex]?.address,
                                style: { marginBottom: '16px' }
                            }, __('Geocode Address', 'openstreetmap-block')),
                            el(TextControl, {
                                label: __('Latitude', 'openstreetmap-block'),
                                value: markers[selectedMarkerIndex]?.lat || '',
                                onChange: (value) => updateMarker(selectedMarkerIndex, 'lat', value),
                                type: 'number',
                                step: 'any',
                            }),
                            el(TextControl, {
                                label: __('Longitude', 'openstreetmap-block'),
                                value: markers[selectedMarkerIndex]?.lng || '',
                                onChange: (value) => updateMarker(selectedMarkerIndex, 'lng', value),
                                type: 'number',
                                step: 'any',
                            }),
                            el(TextareaControl, {
                                label: __('Description', 'openstreetmap-block'),
                                value: markers[selectedMarkerIndex]?.description || '',
                                onChange: (value) => updateMarker(selectedMarkerIndex, 'description', value),
                            })
                        )
                    ),

                    markers.length === 0 && el('div', { style: { textAlign: 'center' } },
                        el('p', {}, __('No markers yet. Click the button to add one.', 'openstreetmap-block')),
                        el(Button, {
                            isPrimary: true,
                            icon: 'plus-alt2',
                            onClick: addMarker,
                        }, __('Add First Marker', 'openstreetmap-block'))
                    )
                )
            ),

            el('div', { className: 'osm-map-container' },
                mapTitle && el('h3', { className: 'osm-map-title' }, mapTitle),
                el('div', {
                    ref: mapContainerRef,
                    className: 'osm-map',
                    style: { height: `${mapHeight}px`, position: 'relative' }
                }),
                allowInnerBlocks && el('div', { 
                    className: 'osm-inner-blocks',
                    style: {
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }
                },
                    el('div', { style: { pointerEvents: 'auto' } },
                        el(InnerBlocks, {
                            allowedBlocks: ['core/paragraph', 'core/heading', 'core/group', 'core/columns', 'core/button', 'core/html'],
                            template: [
                                ['core/paragraph', { placeholder: 'Add content overlay to your map...' }]
                            ],
                            templateLock: false
                        })
                    )
                ),
                geocodingError && el(Notice, {
                    status: 'error',
                    isDismissible: true,
                    onRemove: () => setGeocodingError('')
                }, geocodingError),
                !markers.length && el(Notice, { status: 'info', isDismissible: false },
                    __('Add markers from the block settings sidebar.', 'openstreetmap-block')
                )
            )
        );
    },

    save: function(props) {
        const { attributes } = props;
        const { allowInnerBlocks } = attributes;
        
        return el('div', useBlockProps.save(),
            allowInnerBlocks && el('div', { 
                className: 'osm-inner-blocks',
                style: {
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    right: '10px',
                    zIndex: 1000,
                    pointerEvents: 'none'
                }
            },
                el('div', { style: { pointerEvents: 'auto' } },
                    el(InnerBlocks.Content)
                )
            )
        );
    }
}); 