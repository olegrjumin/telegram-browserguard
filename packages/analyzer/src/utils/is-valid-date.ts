export const isValidDate = (date: Date): boolean => {
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    date <= new Date() &&
    date.getFullYear() >= 1980
  );
};
