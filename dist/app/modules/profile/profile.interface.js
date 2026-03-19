"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomicalStatus = exports.Personality = exports.GuardianRelation = exports.Gender = void 0;
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
})(Gender || (exports.Gender = Gender = {}));
var GuardianRelation;
(function (GuardianRelation) {
    GuardianRelation["FATHER"] = "father";
    GuardianRelation["MOTHER"] = "mother";
    GuardianRelation["BROTHER"] = "brother";
    GuardianRelation["SISTER"] = "sister";
    GuardianRelation["UNCLE"] = "uncle";
    GuardianRelation["AUNT"] = "aunt";
    GuardianRelation["GUARDIAN"] = "guardian";
})(GuardianRelation || (exports.GuardianRelation = GuardianRelation = {}));
var Personality;
(function (Personality) {
    Personality["SOCIAL_HEART"] = "Social Heart";
    Personality["BALANCED_SOUL"] = "Balanced Soul";
    Personality["PRIVATE_THINKER"] = "Private Thinker";
})(Personality || (exports.Personality = Personality = {}));
var EconomicalStatus;
(function (EconomicalStatus) {
    EconomicalStatus["LOW"] = "Low";
    EconomicalStatus["MEDIUM"] = "Medium";
    EconomicalStatus["HIGH"] = "High";
})(EconomicalStatus || (exports.EconomicalStatus = EconomicalStatus = {}));
