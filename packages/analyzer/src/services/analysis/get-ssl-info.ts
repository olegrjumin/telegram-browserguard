import { SSLInfoRawData } from "@/types";
import tls from "tls";
import { URL } from "url";

export const getSSLInfo = (domain: string): Promise<SSLInfoRawData> => {
  return new Promise((resolve, reject) => {
    const url = new URL(
      domain.startsWith("http") ? domain : `https://${domain}`
    );
    const options = {
      host: url.hostname,
      port: 443,
      servername: url.hostname,
    };

    const socket = tls.connect(options, () => {
      const cert = socket.getPeerCertificate();

      if (!cert || Object.keys(cert).length === 0) {
        socket.destroy();
        resolve(null);
        return;
      }

      const validFrom = cert.valid_from;
      const validTo = cert.valid_to;
      const issuer = cert.issuer?.O || "Unknown issuer";
      const valid = socket.authorized;
      const daysRemaining = validTo
        ? Math.ceil(
            (new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      socket.destroy();
      resolve({ validFrom, validTo, issuer, valid, daysRemaining });
    });

    socket.on("error", (err) => {
      reject(new Error(`SSL connection error: ${err.message}`));
    });
  });
};
