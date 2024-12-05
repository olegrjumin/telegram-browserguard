import {
  getCNAMERecords,
  getHostnames,
  getIPAddresses,
  getMXRecords,
  getRecords,
  getTXTRecords,
} from "./dns";
import getIPGeolocationInfo from "./ip-geolocation";
import getWildcardDomain from "./wildcard-domain";

export {
  getIPAddresses,
  getRecords,
  getHostnames,
  getCNAMERecords,
  getTXTRecords,
  getMXRecords,
  getIPGeolocationInfo,
  getWildcardDomain,
};
