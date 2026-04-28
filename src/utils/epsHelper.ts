import crypto from "crypto";
import axios from "axios";
import { envVars } from "../config/envConfig";

// ─── EPS Sandbox API Endpoints ────────────────────────────────────────────────
export const EPS_URLS = {
    GET_TOKEN:  "https://sandboxpgapi.eps.com.bd/v1/Auth/GetToken",
    INITIALIZE: "https://sandboxpgapi.eps.com.bd/v1/EPSEngine/InitializeEPS",
    VERIFY:     "https://sandboxpgapi.eps.com.bd/v1/EPSEngine/CheckMerchantTransactionStatus",
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
export const generateEPSHash = (data: string): string => {
    const encodedKey = Buffer.from(envVars.EPS_HASH_KEY, "utf8");
    const hmac = crypto.createHmac("sha512", encodedKey);
    hmac.update(data);
    return hmac.digest("base64");
};

// ─── Token Cache ──────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

// ─── API No. 01: GetToken ─────────────────────────────────────────────────────
export const getEPSToken = async (): Promise<string> => {

    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
        return cachedToken;
    }

    const xHash = generateEPSHash(envVars.EPS_USERNAME);

    const response = await axios.post(
        EPS_URLS.GET_TOKEN,
        {
            userName: envVars.EPS_USERNAME,
            password: envVars.EPS_PASSWORD,
        },
        {
            headers: {
                "Content-Type": "application/json",
                "x-hash": xHash,
            },
        }
    );

    if (!response.data?.token) {
        throw new Error(`EPS GetToken failed: ${response.data?.errorMessage ?? "Unknown error"}`);
    }

    cachedToken = response.data.token;

    tokenExpiry = new Date(response.data.expireDate);
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() - 5);

    console.log("✅ EPS Token obtained, expires:", tokenExpiry);
    return cachedToken as string;
};