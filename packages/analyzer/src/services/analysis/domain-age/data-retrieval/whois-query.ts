import net from "net";

type WhoisServerMap = { [tld: string]: string };

const WHOIS_SERVERS: WhoisServerMap = {
  com: "whois.verisign-grs.com",
  org: "whois.pir.org",
  net: "whois.verisign-grs.com",
  io: "whois.nic.io",
  co: "whois.nic.co",
  info: "whois.afilias.net",
  edu: "whois.educause.edu",
  gov: "whois.nic.gov",
  biz: "whois.neulevel.biz",
  uk: "whois.nic.uk",
  ca: "whois.cira.ca",
  us: "whois.nic.us",
  au: "whois.audns.net.au",
  de: "whois.denic.de",
  jp: "whois.jprs.jp",
  in: "whois.registry.in",
  br: "whois.registro.br",
  pt: "whois.dns.pt",
  fr: "whois.afnic.fr",
  it: "whois.nic.it",
  es: "whois.nic.es",
  cn: "whois.cnnic.cn",
  ru: "whois.tcinet.ru",
  nl: "whois.domain-registry.nl",
  be: "whois.dns.be",
  ch: "whois.nic.ch",
  dk: "whois.dk-hostmaster.dk",
  se: "whois.iis.se",
};

const IANA_WHOIS = "whois.iana.org";

const queryServer = (hostname: string, server: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let data = "";

    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("Connection timeout"));
    }, 10000);

    client.connect(43, server, () => {
      client.write(`${hostname}\r\n`);
    });

    client.on("data", (chunk) => {
      data += chunk.toString();
    });

    client.on("end", () => {
      clearTimeout(timeout);
      resolve(data);
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};

export const whoisQuery = async (
  hostname: string,
  tld: string
): Promise<string | null> => {
  const whoisServer = WHOIS_SERVERS[tld];

  if (whoisServer) {
    try {
      const result = await queryServer(hostname, whoisServer);
      return result;
    } catch (error) {
      console.error(`Direct WHOIS query failed: ${error}`);
    }
  }

  // Fallback: Query IANA to find the correct WHOIS server
  try {
    const ianaResponse = await queryServer(hostname, IANA_WHOIS);
    const whoisServerMatch = ianaResponse.match(/whois:\s+(.*)/i);

    if (whoisServerMatch && whoisServerMatch[1]) {
      const discoveredWhoisServer = whoisServerMatch[1].trim();
      return await queryServer(hostname, discoveredWhoisServer);
    }
  } catch (error) {
    console.error(`IANA fallback query failed: ${error}`);
  }

  return null;
};
