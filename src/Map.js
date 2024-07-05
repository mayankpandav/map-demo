import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-control-geocoder';

const Map = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [route, setRoute] = useState(null);

  const handleSearch = async () => {
    if (start && end) {
      const startResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(start)}`);
      const endResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(end)}`);
      
      const startData = await startResponse.json();
      const endData = await endResponse.json();

      if (startData.length > 0 && endData.length > 0) {
        const startCoords = [startData[0].lat, startData[0].lon];
        const endCoords = [endData[0].lat, endData[0].lon];
        setRoute({ startCoords, endCoords });
      } else {
        alert('One or both locations not found. Please try different queries.');
      }
    }
  };

  const MapWithRouting = () => {
    const map = useMap();

    useEffect(() => {
      if (!route) return;

      const { startCoords, endCoords } = route;

      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(startCoords[0], startCoords[1]),
          L.latLng(endCoords[0], endCoords[1])
        ],
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim(),
        lineOptions: {
          styles: [{ color: 'blue', weight: 4 }]
        }
      }).addTo(map);

      map.fitBounds([
        [startCoords[0], startCoords[1]],
        [endCoords[0], endCoords[1]]
      ]);

      return () => {
        if (map.hasLayer(routingControl)) {
          map.removeControl(routingControl);
        }
      };
    }, [route, map]);

    return null;
  };

  return (
    <div>
    
      <div>
        <input
          type="text"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="Start location"
          style={{ width: '300px', padding: '10px', margin: '10px' }}
        />
        <input
          type="text"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="End location"
          style={{ width: '300px', padding: '10px', margin: '10px' }}
        />
        <button onClick={handleSearch} style={{ padding: '10px' }}>
          Search
        </button>
      </div>
      <MapContainer
        center={[51.505, -0.09]} 
        zoom={13}
        style={{ height: '100vh', width: '100vw', }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapWithRouting />
      </MapContainer>
    </div>
  );
};

export default Map;