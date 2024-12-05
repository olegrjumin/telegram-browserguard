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

const whoisQuery = async (
  hostname: string,
  tld: string
): Promise<string | null> => {
  const whoisServer = WHOIS_SERVERS[tld];

  if (!whoisServer) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const client = net.createConnection(43, whoisServer, () => {
      client.write(`${hostname}\r\n`);
    });

    let data = "";

    client.on("data", (chunk) => {
      data += chunk.toString();
    });

    client.on("end", () => {
      resolve(data);
    });

    client.on("error", (err) => {
      reject(err);
    });
  });
};

export default whoisQuery;
