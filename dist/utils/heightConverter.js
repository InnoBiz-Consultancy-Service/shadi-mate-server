"use strict";
// utils/heightConverter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCmFromDisplayHeight = exports.toDisplayHeight = exports.parseFtInToCm = exports.cmToDisplayHeight = void 0;
// cm থেকে display string বানাও
const cmToDisplayHeight = (cm) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}ft ${inches}in - ${cm}cm`;
};
exports.cmToDisplayHeight = cmToDisplayHeight;
// ft+in string থেকে cm বের করো
const parseFtInToCm = (ftIn) => {
    const match = ftIn.match(/(\d+)ft\s*(\d+)in/);
    if (!match)
        throw new Error("Invalid height format");
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return Math.round((feet * 12 + inches) * 2.54);
};
exports.parseFtInToCm = parseFtInToCm;
// যেই format-ই ইনপুট দিক না কেন, display string বানাও
const toDisplayHeight = (input) => {
    if (input === undefined || input === null)
        return undefined;
    if (typeof input === 'number') {
        // cm হিসেবে পেলে
        return (0, exports.cmToDisplayHeight)(input);
    }
    else if (typeof input === 'string') {
        // ft+in string পেলে যেমন "5ft 8in"
        if (input.includes('ft') && input.includes('in')) {
            // ইতিমধ্যে display string কিনা চেক করো
            if (input.includes(' - ')) {
                return input; // already in display format
            }
            const cm = (0, exports.parseFtInToCm)(input);
            return `${input} - ${cm}cm`;
        }
        // সরাসরি cm string পেলে যেমন "172"
        const cm = parseInt(input);
        if (!isNaN(cm)) {
            return (0, exports.cmToDisplayHeight)(cm);
        }
    }
    return input;
};
exports.toDisplayHeight = toDisplayHeight;
// display string থেকে cm বের করো (filtering এর জন্য)
const extractCmFromDisplayHeight = (displayHeight) => {
    const match = displayHeight.match(/(\d+)cm/);
    if (match) {
        return parseInt(match[1]);
    }
    return null;
};
exports.extractCmFromDisplayHeight = extractCmFromDisplayHeight;
