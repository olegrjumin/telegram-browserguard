import { config } from "@/project-config";
import { IpGeolocationResponse } from "@/types";
import axios from "axios";

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
