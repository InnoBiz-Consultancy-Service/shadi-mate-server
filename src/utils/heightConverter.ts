// utils/heightConverter.ts

// cm থেকে display string বানাও
export const cmToDisplayHeight = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}ft ${inches}in - ${cm}cm`;
};

// ft+in string থেকে cm বের করো
export const parseFtInToCm = (ftIn: string): number => {
  const match = ftIn.match(/(\d+)ft\s*(\d+)in/);
  if (!match) throw new Error("Invalid height format");
  const feet = parseInt(match[1]);
  const inches = parseInt(match[2]);
  return Math.round((feet * 12 + inches) * 2.54);
};

// যেই format-ই ইনপুট দিক না কেন, display string বানাও
export const toDisplayHeight = (input: number | string | undefined | null): string | undefined => {
  if (input === undefined || input === null) return undefined;
  
  if (typeof input === 'number') {
    // cm হিসেবে পেলে
    return cmToDisplayHeight(input);
  } else if (typeof input === 'string') {
    // ft+in string পেলে যেমন "5ft 8in"
    if (input.includes('ft') && input.includes('in')) {
      // ইতিমধ্যে display string কিনা চেক করো
      if (input.includes(' - ')) {
        return input; // already in display format
      }
      const cm = parseFtInToCm(input);
      return `${input} - ${cm}cm`;
    }
    // সরাসরি cm string পেলে যেমন "172"
    const cm = parseInt(input);
    if (!isNaN(cm)) {
      return cmToDisplayHeight(cm);
    }
  }
  return input as string;
};

// display string থেকে cm বের করো (filtering এর জন্য)
export const extractCmFromDisplayHeight = (displayHeight: string): number | null => {
  const match = displayHeight.match(/(\d+)cm/);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
};