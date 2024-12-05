const exportHostname = (url: string): string => {
  try {
    let { hostname } = new URL(url);
    hostname = hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return "";
  }
};

export default exportHostname;
