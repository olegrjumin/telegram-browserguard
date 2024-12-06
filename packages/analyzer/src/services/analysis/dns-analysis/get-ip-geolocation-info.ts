import { config } from "@/project-config";
import axios from "axios";

export type GeoInfo = {
  ip: string;
  continent_code?: string;
  continent_name?: string;
  country_code2: string;
  country_code3: string;
  country_name: string;
  country_name_official: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  is_eu: false;
  geoname_id: string;
  isp?: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
};

export type IpGeolocationResponse = {
  geoInfo: GeoInfo;
};

const GEOLOCATION_API_BASE_URL = "https://api.ipgeolocation.io";

export async function getIPGeolocationInfo(
  addresses: string[]
): Promise<IpGeolocationResponse[]> {
  const requests = addresses.map(async (ip) => {
    try {
      const response = await axios.get(`${GEOLOCATION_API_BASE_URL}/ipgeo`, {
        params: {
          ip,
          apiKey: config.IP_GEOLOCATION_API_KEY,
          fields: "geo",
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch geolocation for IP ${ip}:`, error);
      return null;
    }
  });

  const results = await Promise.all(requests);
  return results.filter(
    (result): result is IpGeolocationResponse => result !== null
  );
}
