"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCmFromDisplayHeight = exports.toDisplayHeight = exports.parseFtInToCm = exports.cmToDisplayHeight = void 0;
const cmToDisplayHeight = (cm) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}ft ${inches}in - ${cm}cm`;
};
exports.cmToDisplayHeight = cmToDisplayHeight;
const parseFtInToCm = (ftIn) => {
    const match = ftIn.match(/(\d+)ft\s*(\d+)in/);
    if (!match)
        throw new Error("Invalid height format");
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return Math.round((feet * 12 + inches) * 2.54);
};
exports.parseFtInToCm = parseFtInToCm;
const toDisplayHeight = (input) => {
    if (input === undefined || input === null)
        return undefined;
    if (typeof input === 'number') {
        return (0, exports.cmToDisplayHeight)(input);
    }
    else if (typeof input === 'string') {
        if (input.includes('ft') && input.includes('in')) {
            if (input.includes(' - ')) {
                return input;
            }
            const cm = (0, exports.parseFtInToCm)(input);
            return `${input} - ${cm}cm`;
        }
        const cm = parseInt(input);
        if (!isNaN(cm)) {
            return (0, exports.cmToDisplayHeight)(cm);
        }
    }
    return input;
};
exports.toDisplayHeight = toDisplayHeight;
const extractCmFromDisplayHeight = (displayHeight) => {
    const match = displayHeight.match(/(\d+)cm/);
    if (match) {
        return parseInt(match[1]);
    }
    return null;
};
exports.extractCmFromDisplayHeight = extractCmFromDisplayHeight;
