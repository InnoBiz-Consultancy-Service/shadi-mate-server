"use strict";
// utils/heightConverter.ts — FULLY FIXED with complete null safety
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidHeight = exports.getHeightCmForAggregation = exports.extractCmFromDisplayHeight = exports.toDisplayHeight = exports.parseFtInToCm = exports.cmToDisplayHeight = void 0;
const cmToDisplayHeight = (cm) => {
    // ✅ null/undefined/NaN check
    if (!cm || cm === null || cm === undefined || isNaN(cm) || cm <= 0) {
        return "5ft 5in - 165cm"; // default height
    }
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}ft ${inches}in - ${cm}cm`;
};
exports.cmToDisplayHeight = cmToDisplayHeight;
const parseFtInToCm = (ftIn) => {
    // ✅ null/undefined/empty check
    if (!ftIn || ftIn === null || ftIn === undefined || ftIn === "") {
        return 165; // default 165cm
    }
    const match = ftIn.match(/(\d+)ft\s*(\d+)in/);
    if (!match)
        return 165; // default if format invalid
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return Math.round((feet * 12 + inches) * 2.54);
};
exports.parseFtInToCm = parseFtInToCm;
const toDisplayHeight = (input) => {
    // ✅ FIX 1: null/undefined/empty string check
    if (input === undefined || input === null || input === "") {
        return undefined;
    }
    if (typeof input === 'string' && input.includes('ft') && input.includes('in') && input.includes('cm')) {
        return input;
    }
    // ✅ FIX 3: Number type handling
    if (typeof input === 'number') {
        if (isNaN(input) || input <= 0) {
            return undefined;
        }
        return (0, exports.cmToDisplayHeight)(input);
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
            const cm = (0, exports.parseFtInToCm)(input);
            return `${input} - ${cm}cm`;
        }
        const cm = parseInt(input);
        if (!isNaN(cm) && cm > 0) {
            return (0, exports.cmToDisplayHeight)(cm);
        }
    }
    return undefined;
};
exports.toDisplayHeight = toDisplayHeight;
const extractCmFromDisplayHeight = (displayHeight) => {
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
exports.extractCmFromDisplayHeight = extractCmFromDisplayHeight;
// ✅ NEW: safe wrapper for aggregation and database operations
const getHeightCmForAggregation = (height) => {
    if (!height || height === null || height === undefined || height === "") {
        return null;
    }
    if (typeof height === 'number') {
        return height;
    }
    if (typeof height === 'string') {
        // Try to extract cm
        const cm = (0, exports.extractCmFromDisplayHeight)(height);
        if (cm)
            return cm;
        // Try to parse as number
        const num = parseInt(height);
        if (!isNaN(num))
            return num;
    }
    return null;
};
exports.getHeightCmForAggregation = getHeightCmForAggregation;
// ✅ NEW: check if height is valid
const isValidHeight = (height) => {
    if (!height || height === null || height === undefined || height === "") {
        return false;
    }
    if (typeof height === 'number') {
        return height > 0 && height < 300; // between 1cm and 300cm
    }
    if (typeof height === 'string') {
        const cm = (0, exports.extractCmFromDisplayHeight)(height);
        if (cm)
            return cm > 0 && cm < 300;
        const num = parseInt(height);
        if (!isNaN(num))
            return num > 0 && num < 300;
    }
    return false;
};
exports.isValidHeight = isValidHeight;
