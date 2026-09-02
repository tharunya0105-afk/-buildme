// ─── Spatial Data Service ───────────────────────────────────────────────────
// Abstraction layer for external geospatial datasets.
// Currently returns "unavailable" for all external data.
// When real datasets are connected, implement the actual data fetching here.

export interface WeatherData {
  available: false;
  reason: string;
}

export interface TerrainData {
  available: false;
  reason: string;
}

export interface FloodData {
  available: false;
  reason: string;
}

export interface InfrastructureData {
  available: false;
  reason: string;
}

export interface RegionalCostData {
  available: false;
  reason: string;
}

export interface SpatialPropertyLocation {
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
}

// ─── Service Implementation ────────────────────────────────────────────────

const UNAVAILABLE_REASON = "No verified external dataset connected";

export const SpatialDataService = {
  /**
   * Get property location data from the database.
   */
  getPropertyLocation(property: {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    city: string | null;
    district: string | null;
    state: string | null;
    pincode: string | null;
  }): SpatialPropertyLocation | null {
    if (!property.latitude || !property.longitude) return null;
    return {
      latitude: property.latitude,
      longitude: property.longitude,
      address: property.address,
      city: property.city,
      district: property.district,
      state: property.state,
      pincode: property.pincode,
      country: "India",
    };
  },

  /**
   * Get weather data for a location.
   * NOT IMPLEMENTED — requires external weather API integration.
   */
  async getWeatherData(_lat: number, _lon: number): Promise<WeatherData> {
    return { available: false, reason: UNAVAILABLE_REASON };
  },

  /**
   * Get terrain data for a location.
   * NOT IMPLEMENTED — requires external terrain/elevation dataset.
   */
  async getTerrainData(_lat: number, _lon: number): Promise<TerrainData> {
    return { available: false, reason: UNAVAILABLE_REASON };
  },

  /**
   * Get flood risk data for a location.
   * NOT IMPLEMENTED — requires verified flood zone dataset.
   */
  async getFloodData(_lat: number, _lon: number): Promise<FloodData> {
    return { available: false, reason: UNAVAILABLE_REASON };
  },

  /**
   * Get infrastructure data for a location.
   * NOT IMPLEMENTED — requires infrastructure dataset.
   */
  async getInfrastructureData(_lat: number, _lon: number): Promise<InfrastructureData> {
    return { available: false, reason: UNAVAILABLE_REASON };
  },

  /**
   * Get regional construction cost data.
   * NOT IMPLEMENTED — requires verified cost dataset.
   */
  async getRegionalCostData(_district: string, _state: string): Promise<RegionalCostData> {
    return { available: false, reason: UNAVAILABLE_REASON };
  },

  /**
   * Get data source information for UI display.
   */
  getDataSources() {
    return [
      { name: "Property Location", status: "available" as const, source: "User-provided / GPS", lastUpdated: "Current session" },
      { name: "Weather Data", status: "unavailable" as const, source: "No verified source connected", lastUpdated: null },
      { name: "Terrain Data", status: "unavailable" as const, source: "No verified source connected", lastUpdated: null },
      { name: "Flood Risk", status: "unavailable" as const, source: "No verified source connected", lastUpdated: null },
      { name: "Infrastructure", status: "unavailable" as const, source: "No verified source connected", lastUpdated: null },
      { name: "Regional Cost Index", status: "unavailable" as const, source: "No verified source connected", lastUpdated: null },
    ];
  },
};
