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
exports.getEPSToken = exports.generateEPSHash = exports.EPS_URLS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const envConfig_1 = require("../config/envConfig");
// ─── EPS Sandbox API Endpoints ────────────────────────────────────────────────
exports.EPS_URLS = {
    GET_TOKEN: "https://sandboxpgapi.eps.com.bd/v1/Auth/GetToken",
    INITIALIZE: "https://sandboxpgapi.eps.com.bd/v1/EPSEngine/InitializeEPS",
    VERIFY: "https://sandboxpgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus",
};
// Production URL গুলো (production deploy এ এগুলো use করো):
// GET_TOKEN:  "https://pgapi.eps.com.bd/v1/Auth/GetToken"
// INITIALIZE: "https://pgapi.eps.com.bd/v1/EPSEngine/InitializeEPS"
// VERIFY:     "https://pgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus"
// ─── Hash Generation (PDF এর Step 1-4 অনুযায়ী) ──────────────────────────────
// Step 1: Encode Hash Key using UTF8
// Step 2: Create HMACSHA512 using encoded data
// Step 3: Compute Hash using created hmac and the data (userName or merchantTransactionId)
// Step 4: Return Base64 string of Hash
const generateEPSHash = (data) => {
    const encodedKey = Buffer.from(envConfig_1.envVars.EPS_HASH_KEY, "utf8");
    const hmac = crypto_1.default.createHmac("sha512", encodedKey);
    hmac.update(data);
    return hmac.digest("base64");
};
exports.generateEPSHash = generateEPSHash;
// ─── Token Cache ──────────────────────────────────────────────────────────────
// প্রতিবার নতুন token নিলে slow হয় — memory তে cache করে রাখবো
let cachedToken = null;
let tokenExpiry = null;
// ─── API No. 01: GetToken ─────────────────────────────────────────────────────
const getEPSToken = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Cache valid থাকলে সেটাই return করো
    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
        return cachedToken;
    }
    // x-hash: userName দিয়ে HMACSHA512 hash তৈরি করো
    const xHash = (0, exports.generateEPSHash)(envConfig_1.envVars.EPS_USERNAME);
    const response = yield axios_1.default.post(exports.EPS_URLS.GET_TOKEN, {
        userName: envConfig_1.envVars.EPS_USERNAME,
        password: envConfig_1.envVars.EPS_PASSWORD,
    }, {
        headers: {
            "Content-Type": "application/json",
            "x-hash": xHash,
        },
    });
    if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.token)) {
        throw new Error(`EPS GetToken failed: ${(_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.errorMessage) !== null && _c !== void 0 ? _c : "Unknown error"}`);
    }
    cachedToken = response.data.token;
    // Expire হওয়ার ৫ মিনিট আগে নতুন token নেবো
    tokenExpiry = new Date(response.data.expireDate);
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() - 5);
    console.log("✅ EPS Token obtained, expires:", tokenExpiry);
    return cachedToken;
});
exports.getEPSToken = getEPSToken;
