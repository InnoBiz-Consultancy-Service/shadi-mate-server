
export const cmToDisplayHeight = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}ft ${inches}in - ${cm}cm`;
};

export const parseFtInToCm = (ftIn: string): number => {
  const match = ftIn.match(/(\d+)ft\s*(\d+)in/);
  if (!match) throw new Error("Invalid height format");
  const feet = parseInt(match[1]);
  const inches = parseInt(match[2]);
  return Math.round((feet * 12 + inches) * 2.54);
};

export const toDisplayHeight = (input: number | string | undefined | null): string | undefined => {
  if (input === undefined || input === null) return undefined;
  
  if (typeof input === 'number') {
    return cmToDisplayHeight(input);
  } else if (typeof input === 'string') {
    if (input.includes('ft') && input.includes('in')) {
      if (input.includes(' - ')) {
        return input; 
      }
      const cm = parseFtInToCm(input);
      return `${input} - ${cm}cm`;
    }
    const cm = parseInt(input);
    if (!isNaN(cm)) {
      return cmToDisplayHeight(cm);
    }
  }
  return input as string;
};

export const extractCmFromDisplayHeight = (displayHeight: string): number | null => {
  const match = displayHeight.match(/(\d+)cm/);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
};