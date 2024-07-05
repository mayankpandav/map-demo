import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-control-geocoder";

const Map = () => {
  const mapRef = useRef(null);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [route, setRoute] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  let startTimeout;
  let endTimeout;

  const fetchSuggestions = async (query, setSuggestions) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    );
    const data = await response.json();
    setSuggestions(data);
  };
  const debouncedFetchStartSuggestions = (query) => {
    clearTimeout(startTimeout);
    startTimeout = setTimeout(
      () => fetchSuggestions(query, setStartSuggestions),
      300
    );
  };

  const debouncedFetchEndSuggestions = (query) => {
    clearTimeout(endTimeout);
    endTimeout = setTimeout(
      () => fetchSuggestions(query, setEndSuggestions),
      300
    );
  };
  useEffect(() => {
    debouncedFetchStartSuggestions(start);
    return () => clearTimeout(startTimeout);
  }, [start]);

  useEffect(() => {
    debouncedFetchEndSuggestions(end);
    return () => clearTimeout(endTimeout);
  }, [end]);

  const handleSearch = async () => {

    if (start && end) {
      const startResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          start
        )}`
      );
      const endResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          end
        )}`
      );

      const startData = await startResponse.json();
      const endData = await endResponse.json();
      if (startData.length > 0 && endData.length > 0) {
        const startCoords = [startData[0].lat, startData[0].lon];
        const endCoords = [endData[0].lat, endData[0].lon];
        setRoute({ startCoords, endCoords });
      } else {
        alert("One or both locations not found. Please try different queries.");
      }
    }
  };
  const handleSearchfromurl = async (start,end) => {

    if (start && end) {
      const startResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          start
        )}`
      );
      const endResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          end
        )}`
      );

      const startData = await startResponse.json();
      const endData = await endResponse.json();
      if (startData.length > 0 && endData.length > 0) {
        const startCoords = [startData[0].lat, startData[0].lon];
        const endCoords = [endData[0].lat, endData[0].lon];
        setRoute({ startCoords, endCoords });
      } else {
        alert("One or both locations not found. Please try different queries.");
      }
    }
  };
  const MapWithRouting = () => {
    const map = useMap();

    useEffect(() => {
      if (!route) return;

      const { startCoords, endCoords } = route;
      var greenIcon = new L.Icon({
        iconUrl:
          "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(startCoords[0], startCoords[1]),
          L.latLng(endCoords[0], endCoords[1]),
        ],
        createMarker: function (i, wp, nWps) {
          if (i === 0 || i === nWps - 1) {
            // here change the starting and ending icons
            return L.marker(wp.latLng, {
              icon: greenIcon, // here pass the custom marker icon instance
            });
          }
        },
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim(),
        lineOptions: {
          styles: [{ color: "blue", weight: 4 }],
        },
      }).addTo(map);

      map.fitBounds([
        [startCoords[0], startCoords[1]],
        [endCoords[0], endCoords[1]],
      ]);

      return () => {
        if (map.hasLayer(routingControl)) {
          map.removeControl(routingControl);
        }
      };
    }, [route, map]);

    return null;
  };

  const generateShareableUrl = () => {
    if (route) {
      const { startCoords, endCoords } = route;
      const baseUrl = window.location.origin + window.location.pathname;
      const queryParams = new URLSearchParams({
        start: `${startCoords[0]},${startCoords[1]}`,
        end: `${endCoords[0]},${endCoords[1]}`,
      });
      return `${baseUrl}?${queryParams.toString()}`;
    }
    return null;
  };
  const handleShare = () => {
    const shareUrl = generateShareableUrl();
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert("Copied shareable link to clipboard!");
    } else {
      alert("No route to share.");
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get("start");
    const endParam = params.get("end");

    if (startParam && endParam) {
      const [startLat, startLng] = startParam.split(",");
      const [endLat, endLng] = endParam.split(",");
      setStart(`${startLat},${startLng}`);
      setEnd(`${endLat},${endLng}`);

      handleSearchfromurl(`${startLat},${startLng}`, `${endLat},${endLng}`);
    }
  }, []);

  return (
    <div>
      <div
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <div style={{ position: "relative" }}>
          <input
            type='text'
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder='Start location'
            style={{ width: "300px", padding: "10px", margin: "10px" }}
          />
          {startSuggestions?.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                zIndex: 999,
              }}
            >
              {startSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    cursor: "pointer",
                    padding: "5px",
                    borderBottom: "1px solid #ccc",
                  }}
                  onClick={() => {
                    setStart(suggestion?.display_name);
                    setStartSuggestions([]);
                  }}
                >
                  {suggestion?.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <input
            type='text'
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder='End location'
            style={{ width: "300px", padding: "10px", margin: "10px" }}
          />
          {endSuggestions?.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#fff",
                zIndex: 999,
              }}
            >
              {endSuggestions?.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    cursor: "pointer",
                    padding: "5px",
                    borderBottom: "1px solid #ccc",
                  }}
                  onClick={() => {
                    setEnd(suggestion?.display_name);
                    setEndSuggestions([]);
                  }}
                >
                  {suggestion?.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleSearch} style={{ padding: "10px" }}>
          Go
        </button>
      </div>
      {route !== null && (
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          ref={mapRef}
          style={{ height: "90vh", width: "100vw" }}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapWithRouting />
        </MapContainer>
      )}
    {route !== null && (
        <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          zIndex: 999999,
          cursor: "pointer",
        }}
        onClick={handleShare}
      >
        <div
          style={{
            height: "60px",
            width: "60px",
            borderRadius: "100%",
            background: "blue",
            border: "1px solid blue",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <svg
            fill='#fff'
            height='40px'
            width='40px'
            version='1.1'
            id='Layer_1'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 458.624 458.624'
          >
            <g>
              <g>
                <path
                  d='M339.588,314.529c-14.215,0-27.456,4.133-38.621,11.239l-112.682-78.67c1.809-6.315,2.798-12.976,2.798-19.871
			c0-6.896-0.989-13.557-2.798-19.871l109.64-76.547c11.764,8.356,26.133,13.286,41.662,13.286c39.79,0,72.047-32.257,72.047-72.047
			C411.634,32.258,379.378,0,339.588,0c-39.79,0-72.047,32.257-72.047,72.047c0,5.255,0.578,10.373,1.646,15.308l-112.424,78.491
			c-10.974-6.759-23.892-10.666-37.727-10.666c-39.79,0-72.047,32.257-72.047,72.047s32.256,72.047,72.047,72.047
			c13.834,0,26.753-3.907,37.727-10.666l113.292,79.097c-1.629,6.017-2.514,12.34-2.514,18.872c0,39.79,32.257,72.047,72.047,72.047
			c39.79,0,72.047-32.257,72.047-72.047C411.635,346.787,379.378,314.529,339.588,314.529z'
                />
              </g>
            </g>
          </svg>
        </div>
      </div>)}

    </div>
  );
};

export default Map;
