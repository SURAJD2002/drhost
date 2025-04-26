import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaMapMarkerAlt } from 'react-icons/fa';

const MapComponent = ({ initialLat, initialLon, onLocationSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    // Set Mapbox access token and log for debugging
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
    console.log('Mapbox Token:', process.env.REACT_APP_MAPBOX_TOKEN);

    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is missing');
      return;
    }

    // Initialize map if not already initialized
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [initialLon || 77.591, initialLat || 12.9753],
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add click event for selecting a new location
      map.current.on('click', (e) => {
        if (window.confirm('Set this location as your store location?')) {
          onLocationSelect({ lat: e.lngLat.lat, lon: e.lngLat.lng });
        }
      });
    }

    // Update marker when initialLat and initialLon change
    if (initialLat != null && initialLon != null) {
      if (marker.current) {
        marker.current.remove();
      }
      marker.current = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([initialLon, initialLat])
        .addTo(map.current);
      map.current.setCenter([initialLon, initialLat]);
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
    };
  }, [initialLat, initialLon, onLocationSelect]);

  if (!process.env.REACT_APP_MAPBOX_TOKEN) {
    return (
      <div style={{ color: 'red', padding: '10px' }}>
        Error: Mapbox access token is missing. Please configure REACT_APP_MAPBOX_TOKEN in your .env file.
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '400px', borderRadius: '8px', marginBottom: '10px' }}
      aria-label="Interactive store location map"
    />
  );
};

export default MapComponent;