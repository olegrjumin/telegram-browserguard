export const calculateDomainAge = (creationDate: string): number => {
  const creationDateObj = new Date(creationDate);
  const currentDate = new Date();
  const ageInYears = Math.floor(
    (currentDate.getTime() - creationDateObj.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
  );
  return ageInYears;
};

export const extractCreationDate = (whoisData: string): string | null => {
  const creationDateRegex =
    /\b(?:Creation Date|Created On|Registered On):?\s*([\d\/\-T:.Z]+)\b/i;
  console.log("data inside extractCreationDate ", whoisData);
  const match = creationDateRegex.exec(whoisData);
  console.log("mathces: ", match);
  return match ? match[1] : null;
};
