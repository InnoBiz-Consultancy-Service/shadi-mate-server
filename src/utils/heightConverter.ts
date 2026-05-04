// utils/heightConverter.ts — FULLY FIXED with complete null safety

export const cmToDisplayHeight = (cm: number): string => {
  // ✅ null/undefined/NaN check
  if (!cm || cm === null || cm === undefined || isNaN(cm) || cm <= 0) {
    return "5ft 5in - 165cm"; // default height
  }
  
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}ft ${inches}in - ${cm}cm`;
};

export const parseFtInToCm = (ftIn: string): number => {
  // ✅ null/undefined/empty check
  if (!ftIn || ftIn === null || ftIn === undefined || ftIn === "") {
    return 165; // default 165cm
  }
  
  const match = ftIn.match(/(\d+)ft\s*(\d+)in/);
  if (!match) return 165; // default if format invalid
  
  const feet = parseInt(match[1]);
  const inches = parseInt(match[2]);
  return Math.round((feet * 12 + inches) * 2.54);
};

// ✅ MAIN FUNCTION — সবচেয়ে গুরুত্বপূর্ণ
export const toDisplayHeight = (input: number | string | undefined | null): string | undefined => {
  // ✅ FIX 1: null/undefined/empty string check
  if (input === undefined || input === null || input === "") {
    return undefined;
  }
  
  // ✅ FIX 2: যদি ইতিমধ্যে সঠিক format এ থাকে
  if (typeof input === 'string' && input.includes('ft') && input.includes('in') && input.includes('cm')) {
    return input;
  }
  
  // ✅ FIX 3: Number type handling
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0) {
      return undefined;
    }
    return cmToDisplayHeight(input);
  }
  
  // ✅ FIX 4: String type handling
  if (typeof input === 'string') {
    if (input.trim() === "") {
      return undefined;
    }
    
    if (input.includes('ft') && input.includes('in')) {
      if (input.includes(' - ')) {
        return input; 
      }
      const cm = parseFtInToCm(input);
      return `${input} - ${cm}cm`;
    }
    
    const cm = parseInt(input);
    if (!isNaN(cm) && cm > 0) {
      return cmToDisplayHeight(cm);
    }
  }
  
  return undefined;
};

export const extractCmFromDisplayHeight = (displayHeight: string): number | null => {
  // ✅ null/undefined/empty check
  if (!displayHeight || displayHeight === null || displayHeight === undefined || displayHeight === "") {
    return null;
  }
  
  const match = displayHeight.match(/(\d+)cm/);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
};

// ✅ NEW: safe wrapper for aggregation and database operations
export const getHeightCmForAggregation = (height: any): number | null => {
  if (!height || height === null || height === undefined || height === "") {
    return null;
  }
  
  if (typeof height === 'number') {
    return height;
  }
  
  if (typeof height === 'string') {
    // Try to extract cm
    const cm = extractCmFromDisplayHeight(height);
    if (cm) return cm;
    
    // Try to parse as number
    const num = parseInt(height);
    if (!isNaN(num)) return num;
  }
  
  return null;
};

// ✅ NEW: check if height is valid
export const isValidHeight = (height: any): boolean => {
  if (!height || height === null || height === undefined || height === "") {
    return false;
  }
  
  if (typeof height === 'number') {
    return height > 0 && height < 300; // between 1cm and 300cm
  }
  
  if (typeof height === 'string') {
    const cm = extractCmFromDisplayHeight(height);
    if (cm) return cm > 0 && cm < 300;
    
    const num = parseInt(height);
    if (!isNaN(num)) return num > 0 && num < 300;
  }
  
  return false;
};