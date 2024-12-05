import axios from "axios";
import { IP_GEOLOCATION_API } from "../../../../constants";

const getIPGeolocationInfo = async (addresses: string[]): Promise<any[]> => {
  const API_KEY = process.env.IP_GEOLOCATION_API_KEY;
  const results = await Promise.all(
    addresses.map(async (ip) => {
      const geoInfo = await axios
        .get(
          `${IP_GEOLOCATION_API}/ipgeo?ip=${ip}&apiKey=${API_KEY}&fields=geo`
        ) // Development purposes
        .then((res) => res.data)
        .catch(() => null);
      return { geoInfo };
    })
  );
  return results;
};

export default getIPGeolocationInfo;
