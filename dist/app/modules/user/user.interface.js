"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TGender = exports.TUserRole = void 0;
// ─── User ────────────────────────────────────────────────────────────────────
var TUserRole;
(function (TUserRole) {
    TUserRole["USER"] = "user";
    TUserRole["ADMIN"] = "admin";
})(TUserRole || (exports.TUserRole = TUserRole = {}));
var TGender;
(function (TGender) {
    TGender["MALE"] = "male";
    TGender["FEMALE"] = "female";
    TGender["OTHER"] = "other";
})(TGender || (exports.TGender = TGender = {}));
