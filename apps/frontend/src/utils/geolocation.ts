export interface Location {
  lat: number;
  lng: number;
}

const FALLBACK_LOCATION: Location = { lat: 25.4294, lng: 81.7702 }; // IIIT Allahabad

export const getCurrentLocation = async (): Promise<Location> => {
  try {
    const coords = await new Promise<Location>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported by browser"));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
    
    return coords;
  } catch (error) {
    console.warn("⚠️ GPS Failed or Denied. Using fallback location.", error);
    return FALLBACK_LOCATION;
  }
};