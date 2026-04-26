"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBDTtoGBP = exports.getBDTtoGBPRate = exports.getCurrencyByCountry = exports.getCountryFromIP = void 0;
const axios_1 = __importDefault(require("axios"));
const redis_1 = __importDefault(require("./redis"));
const BDT = { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" };
const GBP = { code: "GBP", symbol: "£", name: "British Pound" };
// ─── Cache Keys ───────────────────────────────────────────────────────────────
const IP_CACHE_KEY = (ip) => `geo:ip:${ip}`;
const RATE_CACHE_KEY = "fx:rate:BDT:GBP";
const IP_CACHE_TTL = 60 * 60 * 24; // 24 hours
const RATE_CACHE_TTL = 60 * 60 * 6; // 6 hours
// ─── Get Country Code from IP ─────────────────────────────────────────────────
const getCountryFromIP = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    // localhost / private IP → fallback BD
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.")) {
        return "BD";
    }
    try {
        const cached = yield redis_1.default.get(IP_CACHE_KEY(ip));
        if (cached)
            return cached;
    }
    catch (_) { }
    try {
        const { data } = yield axios_1.default.get(`http://ip-api.com/json/${ip}?fields=countryCode`, { timeout: 3000 });
        const countryCode = (data === null || data === void 0 ? void 0 : data.countryCode) || "BD";
        try {
            yield redis_1.default.setEx(IP_CACHE_KEY(ip), IP_CACHE_TTL, countryCode);
        }
        catch (_) { }
        return countryCode;
    }
    catch (_) {
        return "BD";
    }
});
exports.getCountryFromIP = getCountryFromIP;
// ─── BD → BDT, সব বাকি → GBP ────────────────────────────────────────────────
const getCurrencyByCountry = (countryCode) => {
    return countryCode === "BD" ? BDT : GBP;
};
exports.getCurrencyByCountry = getCurrencyByCountry;
// ─── Live BDT → GBP Rate ─────────────────────────────────────────────────────
const getBDTtoGBPRate = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const cached = yield redis_1.default.get(RATE_CACHE_KEY);
        if (cached)
            return parseFloat(cached);
    }
    catch (_) { }
    try {
        const { data } = yield axios_1.default.get("https://api.exchangerate-api.com/v4/latest/BDT", { timeout: 5000 });
        const rate = (_a = data === null || data === void 0 ? void 0 : data.rates) === null || _a === void 0 ? void 0 : _a.GBP;
        if (!rate)
            throw new Error("Rate not found");
        try {
            yield redis_1.default.setEx(RATE_CACHE_KEY, RATE_CACHE_TTL, rate.toString());
        }
        catch (_) { }
        return rate;
    }
    catch (_) {
        return 0.0072; // fallback: 1 BDT ≈ £0.0072
    }
});
exports.getBDTtoGBPRate = getBDTtoGBPRate;
// ─── BDT → GBP Convert ───────────────────────────────────────────────────────
const convertBDTtoGBP = (amountBDT) => __awaiter(void 0, void 0, void 0, function* () {
    const rate = yield (0, exports.getBDTtoGBPRate)();
    const converted = parseFloat((amountBDT * rate).toFixed(2));
    const formatted = `£${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return { converted, formatted, rate };
});
exports.convertBDTtoGBP = convertBDTtoGBP;
