export const calculateDomainAge = (creationDate: string) => {
  const created = new Date(creationDate);
  const now = new Date();
  const ageInYears = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  return ageInYears;
};

export const extractCreationDateFromWhois = (data: string) => {
  const datePatterns = [
    /Creation Date: (.+)/i,
    /created: (.+)/i,
    /Registration Time: (.+)/i,
    /Domain Create Date: (.+)/i,
    /Registered on: (.+)/i,
    /registered:\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+[+-]\d{2}:\d{2})/i,
    /registered:\s*(\d{4}-\d{2}-\d{2})/i,
    /Created:\s*(\d{4}-\d{2}-\d{2})/i,
  ];

  for (const pattern of datePatterns) {
    const match = data.match(pattern);
    if (match?.[1]) {
      try {
        const date = new Date(match[1].trim());
        if (isNaN(date.getTime())) {
          console.error(`Invalid date found: ${match[1]}`);
          continue;
        }
        return date.toISOString();
      } catch (error) {
        console.error(`Error parsing date ${match[1]}:`, error);
        continue;
      }
    }
  }

  const lines = data.split("\n");
  for (const line of lines) {
    if (
      line.toLowerCase().includes("registered:") ||
      line.toLowerCase().includes("creation") ||
      line.toLowerCase().includes("created")
    ) {
      const datePart = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (datePart?.[1]) {
        try {
          const date = new Date(datePart[1]);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (error) {
          console.error(`Error parsing date from line ${line}:`, error);
        }
      }
    }
  }

  return null;
};
