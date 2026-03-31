"use strict";
// ─── Profile Completion Percentage Calculator ─────────────────────────────────
//
// Required fields = বেশি weight
// Optional fields = কম weight
//
// User fields (Registration থেকে):
//   name, email, phone, gender → required (high weight)
//
// Profile fields:
//   Required:  gender, address.divisionId, address.districtId,
//              religion.faith, religion.practiceLevel,
//              personality, profession, habits, education.graduation.variety
//   Optional:  birthDate, address.thanaId, address.details,
//              religion.sectOrCaste, religion.dailyLifeStyleSummary,
//              religion.religiousLifestyleDetails, aboutMe,
//              height, weight, skinTone, salaryRange,
//              economicalStatus, maritalStatus,
//              fatherOccupation, motherOccupation, relation,
//              education.graduation.department,
//              education.graduation.institution,
//              education.graduation.passingYear,
//              education.graduation.universityId,
//              education.graduation.collegeName
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletionLabel = exports.calculateCompletionPercentage = void 0;
// ─── Field Definitions with Weights ──────────────────────────────────────────
const USER_FIELDS = [
    { key: "name", label: "নাম", weight: 10 },
    { key: "email", label: "ইমেইল", weight: 8 },
    { key: "phone", label: "ফোন নম্বর", weight: 8 },
    { key: "gender", label: "লিঙ্গ", weight: 7 },
];
const PROFILE_FIELDS = [
    // ── Required (high weight) ────────────────────────────────────────────────
    { key: "profession", label: "পেশা", weight: 9 },
    { key: "personality", label: "ব্যক্তিত্ব", weight: 8 },
    { key: "habits", label: "অভ্যাস", weight: 7 },
    { key: "economicalStatus", label: "আর্থিক অবস্থা", weight: 7 },
    { key: "address.divisionId", label: "বিভাগ", weight: 7 },
    { key: "address.districtId", label: "জেলা", weight: 7 },
    { key: "religion.faith", label: "ধর্ম", weight: 8 },
    { key: "religion.practiceLevel", label: "ধর্ম পালনের মাত্রা", weight: 6 },
    { key: "education.graduation.variety", label: "শিক্ষার ধরন", weight: 6 },
    // ── Important Optional (medium weight) ───────────────────────────────────
    { key: "birthDate", label: "জন্ম তারিখ", weight: 5 },
    { key: "aboutMe", label: "নিজের সম্পর্কে", weight: 5 },
    { key: "maritalStatus", label: "বৈবাহিক অবস্থা", weight: 4 },
    { key: "address.thanaId", label: "থানা", weight: 3 },
    { key: "address.details", label: "বিস্তারিত ঠিকানা", weight: 3 },
    { key: "religion.dailyLifeStyleSummary", label: "দৈনন্দিন জীবনধারা", weight: 3 },
    { key: "education.graduation.department", label: "বিভাগ/সাবজেক্ট", weight: 3 },
    { key: "education.graduation.institution", label: "প্রতিষ্ঠানের নাম", weight: 3 },
    { key: "education.graduation.passingYear", label: "পাসের বছর", weight: 2 },
    // ── Less Important Optional (low weight) ─────────────────────────────────
    { key: "height", label: "উচ্চতা", weight: 2 },
    { key: "weight", label: "ওজন", weight: 2 },
    { key: "skinTone", label: "গায়ের রঙ", weight: 2 },
    { key: "salaryRange", label: "বেতন পরিসর", weight: 2 },
    { key: "relation", label: "অভিভাবকের সম্পর্ক", weight: 2 },
    { key: "fatherOccupation", label: "বাবার পেশা", weight: 2 },
    { key: "motherOccupation", label: "মায়ের পেশা", weight: 2 },
    { key: "religion.sectOrCaste", label: "মাজহাব/গোত্র", weight: 1 },
    { key: "religion.religiousLifestyleDetails", label: "ধর্মীয় জীবনধারার বিস্তারিত", weight: 1 },
    { key: "education.graduation.universityId", label: "বিশ্ববিদ্যালয়", weight: 2 },
    { key: "education.graduation.collegeName", label: "কলেজের নাম", weight: 1 },
];
// ─── Helper: Nested field value পাও ──────────────────────────────────────────
const getNestedValue = (obj, path) => {
    return path.split(".").reduce((acc, key) => {
        if (acc === null || acc === undefined)
            return undefined;
        return acc[key];
    }, obj);
};
// ─── Helper: Field filled কিনা check করো ─────────────────────────────────────
const isFilled = (value) => {
    if (value === null || value === undefined)
        return false;
    if (typeof value === "string" && value.trim() === "")
        return false;
    if (Array.isArray(value) && value.length === 0)
        return false;
    return true;
};
// ─── Main: Completion Percentage Calculate করো ────────────────────────────────
const calculateCompletionPercentage = (user, profile) => {
    let filledWeight = 0;
    let totalWeight = 0;
    const missingFields = [];
    // ─── User fields check ────────────────────────────────────────────────────
    for (const field of USER_FIELDS) {
        totalWeight += field.weight;
        const value = getNestedValue(user, field.key);
        if (isFilled(value)) {
            filledWeight += field.weight;
        }
        else {
            missingFields.push(field);
        }
    }
    // ─── Profile fields check ─────────────────────────────────────────────────
    for (const field of PROFILE_FIELDS) {
        totalWeight += field.weight;
        if (!profile) {
            missingFields.push(field);
            continue;
        }
        const value = getNestedValue(profile, field.key);
        if (isFilled(value)) {
            filledWeight += field.weight;
        }
        else {
            missingFields.push(field);
        }
    }
    const percentage = Math.round((filledWeight / totalWeight) * 100);
    return {
        percentage,
        filledWeight,
        totalWeight,
        missingFields,
    };
};
exports.calculateCompletionPercentage = calculateCompletionPercentage;
// ─── Completion Label ─────────────────────────────────────────────────────────
const getCompletionLabel = (percentage) => {
    if (percentage >= 90)
        return "Excellent";
    if (percentage >= 70)
        return "Good";
    if (percentage >= 50)
        return "Average";
    if (percentage >= 30)
        return "Incomplete";
    return "Very Incomplete";
};
exports.getCompletionLabel = getCompletionLabel;
