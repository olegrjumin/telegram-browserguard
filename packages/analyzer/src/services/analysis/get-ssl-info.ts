import { SSLInfoRawData } from "@/types";
import tls from "tls";
import { URL } from "url";

interface SSLValidationResult {
  valid: boolean;
  error?: string;
  certificate?: tls.DetailedPeerCertificate;
}

const validateSSLCertificate = (
  socket: tls.TLSSocket,
  hostname: string
): SSLValidationResult => {
  const cert = socket.getPeerCertificate(true);

  if (!cert || Object.keys(cert).length === 0) {
    return { valid: false, error: "No certificate found" };
  }

  return {
    valid: socket.authorized,
    error: socket.authorizationError?.toString(),
    certificate: cert,
  };
};

export const getSSLInfo = (domain: string): Promise<SSLInfoRawData> => {
  return new Promise((resolve) => {
    try {
      const url = new URL(
        domain.startsWith("http") ? domain : `https://${domain}`
      );
      const options = {
        host: url.hostname,
        port: 443,
        servername: url.hostname,
        rejectUnauthorized: false, // Allow invalid certificates to analyze them
      };

      const socket = tls.connect(options, () => {
        const validation = validateSSLCertificate(socket, url.hostname);
        const cert = validation.certificate;

        if (!cert) {
          socket.destroy();
          resolve({
            validFrom: null,
            validTo: null,
            issuer: null,
            valid: false,
            daysRemaining: 0,
          });
          return;
        }

        const validFrom = cert.valid_from;
        const validTo = cert.valid_to;
        const issuer = cert.issuer?.O || "Unknown issuer";
        const daysRemaining = validTo
          ? Math.ceil(
              (new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        socket.destroy();
        resolve({
          validFrom,
          validTo,
          issuer,
          valid: validation.valid,
          daysRemaining,
          validationError: validation.error,
        });
      });

      socket.on("error", (err) => {
        resolve({
          validFrom: null,
          validTo: null,
          issuer: null,
          valid: false,
          daysRemaining: 0,
          validationError: err.message,
        });
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        resolve({
          validFrom: null,
          validTo: null,
          issuer: null,
          valid: false,
          daysRemaining: 0,
          validationError: "Connection timeout",
        });
      });
    } catch (err) {
      resolve({
        validFrom: null,
        validTo: null,
        issuer: null,
        valid: false,
        daysRemaining: 0,
        validationError: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });
};
