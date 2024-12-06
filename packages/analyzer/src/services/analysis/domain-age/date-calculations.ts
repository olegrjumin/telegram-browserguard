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
  ];

  for (const pattern of datePatterns) {
    const match = data.match(pattern);
    if (match?.[1]) {
      return new Date(match[1].trim()).toISOString();
    }
  }
  return null;
};
