"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Habits = exports.EconomicalStatus = exports.Personality = exports.GuardianRelation = exports.Gender = void 0;
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
    Personality["CARING_SOUL"] = "Caring Soul";
    Personality["BALANCED_THINKER"] = "Balanced Thinker";
    Personality["AMBITIOUS_MIND"] = "Ambitious Mind";
})(Personality || (exports.Personality = Personality = {}));
var EconomicalStatus;
(function (EconomicalStatus) {
    EconomicalStatus["LOW"] = "Low";
    EconomicalStatus["MEDIUM"] = "Medium";
    EconomicalStatus["HIGH"] = "High";
})(EconomicalStatus || (exports.EconomicalStatus = EconomicalStatus = {}));
var Habits;
(function (Habits) {
    Habits["READING_BOOKS"] = "Reading Books";
    Habits["TRAVELING"] = "Traveling";
    Habits["COOKING"] = "Cooking";
    Habits["SPORTS"] = "Sports";
    Habits["GYM_FITNESS"] = "Gym/Fitness";
    Habits["WATCHING_MOVIES"] = "Watching Movies";
    Habits["LISTENING_TO_MUSIC"] = "Listening to Music";
    Habits["PHOTOGRAPHY"] = "Photography";
    Habits["GARDENING"] = "Gardening";
    Habits["GAMING"] = "Gaming";
    Habits["WRITING"] = "Writing";
    Habits["ART_AND_CRAFT"] = "Art & Craft";
    Habits["SOCIAL_WORK"] = "Social Work";
    Habits["ENTREPRENEURSHIP"] = "Entrepreneurship";
    Habits["TECHNOLOGY"] = "Technology";
    Habits["OTHERS"] = "others";
})(Habits || (exports.Habits = Habits = {}));
