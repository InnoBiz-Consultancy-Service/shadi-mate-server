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
exports.UserService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("./user.model");
const envConfig_1 = require("../../../config/envConfig");
// ─── Helper: generate 6-digit OTP ────────────────────────────────────────────
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// ─── Register ────────────────────────────────────────────────────────────────
const registerUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, password } = payload;
    // Check if user already exists
    const existingUser = yield user_model_1.User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        if (existingUser.email === email) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, "Email already registered");
        }
        if (existingUser.phone === phone) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, "Phone number already registered");
        }
    }
    // Create user (not yet verified)
    const user = yield user_model_1.User.create({ name, email, phone, password });
    // Generate OTP and save
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    // Delete any existing OTP for this phone
    yield user_model_1.Otp.deleteMany({ phone });
    yield user_model_1.Otp.create({ phone, otp: otpCode, expiresAt });
    // TODO: Replace with real SMS gateway (e.g. Twilio, SSLCommerz notif)
    // await sendSms(phone, `Your Shadi Mate OTP is: ${otpCode}`);
    return {
        userId: user._id,
        phone: user.phone,
        message: "OTP sent to phone number (mock mode — OTP returned in response)",
        // 🔴 DEVELOPMENT ONLY — remove in production:
        otp: otpCode,
    };
});
// ─── Verify OTP ──────────────────────────────────────────────────────────────
const verifyOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, otp } = payload;
    const otpRecord = yield user_model_1.Otp.findOne({ phone });
    if (!otpRecord) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "OTP not found or already expired");
    }
    if (otpRecord.otp !== otp) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid OTP");
    }
    if (otpRecord.expiresAt < new Date()) {
        yield user_model_1.Otp.deleteOne({ phone });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one");
    }
    // Mark user as verified
    const user = yield user_model_1.User.findOneAndUpdate({ phone }, { isVerified: true }, { new: true, select: "-password" });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Delete used OTP
    yield user_model_1.Otp.deleteOne({ phone });
    return {
        message: "Phone number verified successfully",
        user,
    };
});
// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, password } = payload;
    // Find user and include password for comparison
    const user = yield user_model_1.User.findOne({ phone }).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid phone number or password");
    }
    if (user.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked by admin");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Account not verified. Please verify your phone number first");
    }
    const isPasswordCorrect = yield user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid phone number or password");
    }
    // Sign JWT
    const token = jsonwebtoken_1.default.sign({ id: user._id, phone: user.phone, role: user.role }, envConfig_1.envVars.JWT_SECRET, { expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN });
    return {
        message: "Login successful",
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
        },
    };
});
// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    const getUser = yield user_model_1.User.findById(userId);
    if (!getUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (getUser.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Account has been deleted");
    }
    if (getUser.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
    }
    return user;
});
// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ phone });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No user found with this phone number");
    }
    if (user.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This account is already verified");
    }
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    yield user_model_1.Otp.deleteMany({ phone });
    yield user_model_1.Otp.create({ phone, otp: otpCode, expiresAt });
    return {
        message: "OTP resent to phone number (mock mode — OTP returned in response)",
        otp: otpCode, // 🔴 DEVELOPMENT ONLY
    };
});
const updateUser = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const getUser = yield user_model_1.User.findById(userId);
    if (!getUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (getUser.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Account has been deleted");
    }
    if (getUser.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked by admin");
    }
    const user = yield user_model_1.User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true, select: "-password" });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
});
const deleteUser = (userId, requestUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User already deleted");
    }
    // 🔐 Permission Logic
    if (requestUser.role !== "admin" && requestUser.id !== userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only delete your own account");
    }
    user.isDeleted = true;
    yield user.save();
    return null;
});
const updateBlockStatus = (userId, isBlocked, requestUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (requestUser.role !== "admin") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admin can block or unblock users");
    }
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Deleted user cannot be modified");
    }
    user.isBlocked = isBlocked;
    yield user.save();
    return user;
});
exports.UserService = {
    registerUser,
    verifyOtp,
    loginUser,
    getMe,
    resendOtp,
    updateUser,
    deleteUser,
    updateBlockStatus,
};
