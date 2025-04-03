"use client";

import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Intro({ onCheckIn, onCheckOut }) {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState(null);  // State to store the address
  const [error, setError] = useState(null);

  useEffect(() => {
    const requestLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            fetchAddress(lat, lng); // Fetch the address based on the coordinates
          },
          (error) => {
            setError(error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 1000,
          }
        );
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    requestLocation();
  }, []);

  // Function to fetch the address using Geocoding API
  const fetchAddress = async (lat, lng) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU`);
      if (response.data.results && response.data.results.length > 0) {
        const fetchedAddress = response.data.results[0].formatted_address;
        setAddress(fetchedAddress);
        onCheckIn && onCheckIn(fetchedAddress); 
      } else {
        setError("Unable to fetch address.");
      }
    } catch (err) {
      setError("Failed to fetch address.");
    }
  };

  const sourcePosition = { lat: latitude || 0, lng: longitude || 0 };

  return (
    <APIProvider apiKey={'AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU'}>
      <div className="container mt-4">
        {error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <>
            {latitude && longitude ? (
              <>
                <div className="row mb-3">
                  <div className="col-12">
                    {/* <p>Latitude: {latitude}</p>
                    <p>Longitude: {longitude}</p> */}
                    <p>Address: {address ? address : "Fetching address..."}</p>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="map-container" style={{ height: "400px", width: "100%" }}>
                      <Map 
                        zoom={15}
                        center={sourcePosition}
                        mapId={'827a158516c6f167'}
                        options={{
                          gestureHandling: "greedy",
                        }}
                      >
                        <AdvancedMarker position={sourcePosition}>
                          <Pin
                            background={"red"}
                            borderColor={"black"}
                            glyphColor={"white"}
                          />
                        </AdvancedMarker>
                      </Map>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p>Fetching location...</p>
            )}
          </>
        )}
      </div>
    </APIProvider>
  );
}