import axios from "axios";
import redisClient from "./redis";

// ─── Currency Info ────────────────────────────────────────────────────────────
export interface ICurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

const BDT: ICurrencyInfo = { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" };
const GBP: ICurrencyInfo = { code: "GBP", symbol: "£", name: "British Pound" };

// ─── Cache Keys ───────────────────────────────────────────────────────────────
const IP_CACHE_KEY   = (ip: string) => `geo:ip:${ip}`;
const RATE_CACHE_KEY = "fx:rate:BDT:GBP";
const IP_CACHE_TTL   = 60 * 60 * 24; // 24 hours
const RATE_CACHE_TTL = 60 * 60 * 6;  // 6 hours

// ─── Get Country Code from IP ─────────────────────────────────────────────────
export const getCountryFromIP = async (ip: string): Promise<string> => {
  // localhost / private IP → fallback BD
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.")) {
    return "BD";
  }

  try {
    const cached = await redisClient.get(IP_CACHE_KEY(ip));
    if (cached) return cached;
  } catch (_) {}

  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`, { timeout: 3000 });
    const countryCode: string = data?.countryCode || "BD";
    try { await redisClient.setEx(IP_CACHE_KEY(ip), IP_CACHE_TTL, countryCode); } catch (_) {}
    return countryCode;
  } catch (_) {
    return "BD";
  }
};

// ─── BD → BDT, সব বাকি → GBP ────────────────────────────────────────────────
export const getCurrencyByCountry = (countryCode: string): ICurrencyInfo => {
  return countryCode === "BD" ? BDT : GBP;
};

// ─── Live BDT → GBP Rate ─────────────────────────────────────────────────────
export const getBDTtoGBPRate = async (): Promise<number> => {
  try {
    const cached = await redisClient.get(RATE_CACHE_KEY);
    if (cached) return parseFloat(cached);
  } catch (_) {}

  try {
    const { data } = await axios.get("https://api.exchangerate-api.com/v4/latest/BDT", { timeout: 5000 });
    const rate: number = data?.rates?.GBP;
    if (!rate) throw new Error("Rate not found");
    try { await redisClient.setEx(RATE_CACHE_KEY, RATE_CACHE_TTL, rate.toString()); } catch (_) {}
    return rate;
  } catch (_) {
    return 0.0072; // fallback: 1 BDT ≈ £0.0072
  }
};

// ─── BDT → GBP Convert ───────────────────────────────────────────────────────
export const convertBDTtoGBP = async (amountBDT: number): Promise<{ converted: number; formatted: string; rate: number }> => {
  const rate      = await getBDTtoGBPRate();
  const converted = parseFloat((amountBDT * rate).toFixed(2));
  const formatted = `£${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return { converted, formatted, rate };
};