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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const user_model_1 = require("./user.model");
const envConfig_1 = require("../../../config/envConfig");
// ─── Helper: Generate 6-digit OTP ─────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_EXPIRY_MINUTES = 5;
// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, password, gender } = payload;
    const [existingUser, existingOtp] = yield Promise.all([
        user_model_1.User.findOne({ phone }, "_id").lean(),
        user_model_1.Otp.findOne({ phone }, "_id").lean(),
    ]);
    if (existingUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, "Phone number already registered");
    }
    if (existingOtp) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, "OTP already sent to this number. Please verify or use resend-otp");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    yield user_model_1.Otp.create({
        phone,
        otp,
        expiresAt,
        purpose: "registration",
        userData: {
            name,
            email,
            phone,
            password: hashedPassword,
            gender,
        },
    });
    return {
        message: "OTP sent successfully. Please verify your phone number.",
        phone,
        otp, // 🔴 DEVELOPMENT ONLY — remove in production
    };
});
// ─── Verify OTP & Auto-login ─────────────────────────────────────────────────
const verifyOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, otp } = payload;
    const otpDoc = yield user_model_1.Otp.findOne({ phone, purpose: "registration" });
    if (!otpDoc) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No pending registration found for this phone number");
    }
    if (otpDoc.expiresAt < new Date()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.GONE, "OTP expired. Please register again");
    }
    if (otpDoc.otp !== otp) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }
    const user = yield user_model_1.User.create(Object.assign(Object.assign({}, otpDoc.userData), { isVerified: true }));
    yield user_model_1.Otp.deleteOne({ _id: otpDoc._id });
    // ✅ subscription সহ token
    const token = jsonwebtoken_1.default.sign({
        id: user._id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileCompleted: user.isProfileCompleted,
        subscription: user.subscription, // ✅ added
    }, envConfig_1.envVars.JWT_SECRET, {
        expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN,
    });
    return {
        message: "Phone verified successfully. Account created!",
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            role: user.role,
            isVerified: user.isVerified,
            isProfileCompleted: user.isProfileCompleted,
            subscription: user.subscription,
        },
    };
});
// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = (phone) => __awaiter(void 0, void 0, void 0, function* () {
    const newOtp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const updated = yield user_model_1.Otp.findOneAndUpdate({ phone, purpose: "registration" }, { otp: newOtp, expiresAt }, { new: true });
    if (!updated) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No pending registration found for this phone number. Please register first");
    }
    return {
        message: "OTP resent successfully.",
        otp: newOtp, // 🔴 DEVELOPMENT ONLY
    };
});
// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier, password } = payload;
    const user = yield user_model_1.User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");
    if (user) {
        if (user.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
        }
        if (!user.isVerified) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify your account first");
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid credentials");
        }
        // ✅ subscription সহ token
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            isVerified: user.isVerified,
            subscription: user.subscription, // ✅ already here, keeping it
        }, envConfig_1.envVars.JWT_SECRET, {
            expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN,
        });
        return { message: "Login successful", token, user };
    }
    // ─── Pending OTP user login ─────────────────────────────────────────────────
    const otpDoc = yield user_model_1.Otp.findOne({
        $or: [{ phone: identifier }, { "userData.email": identifier }],
        purpose: "registration",
    });
    if (!otpDoc) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Account not found");
    }
    if (otpDoc.expiresAt < new Date()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.GONE, "OTP expired. Please register again");
    }
    const isMatch = yield bcryptjs_1.default.compare(password, otpDoc.userData.password);
    if (!isMatch) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }
    const token = jsonwebtoken_1.default.sign({
        phone: otpDoc.userData.phone,
        email: otpDoc.userData.email,
        role: "user",
        gender: otpDoc.userData.gender,
        isVerified: false,
        subscription: "free", // pending user সবসময় free
        pendingRegistration: true,
    }, envConfig_1.envVars.JWT_SECRET, {
        expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN,
    });
    return {
        message: "Login successful (pending verification)",
        token,
        user: {
            name: otpDoc.userData.name,
            email: otpDoc.userData.email,
            phone: otpDoc.userData.phone,
            gender: otpDoc.userData.gender,
            isVerified: false,
            subscription: "free",
        },
    };
});
// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier, oldPassword, newPassword } = payload;
    const user = yield user_model_1.User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Account not found with this phone/email");
    }
    if (user.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify your account first");
    }
    const isOldPasswordMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
    if (!isOldPasswordMatch) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Current password is incorrect");
    }
    const hashedNewPassword = yield bcryptjs_1.default.hash(newPassword, 12);
    user.password = hashedNewPassword;
    yield user.save();
    // ✅ subscription সহ token
    const token = jsonwebtoken_1.default.sign({
        id: user._id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        isVerified: user.isVerified,
        subscription: user.subscription, // ✅ added
    }, envConfig_1.envVars.JWT_SECRET, { expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN });
    return {
        message: "Password changed successfully. Please login with your new password.",
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
        },
    };
});
// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).lean();
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
});
// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true }).lean();
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
});
// ─── Delete User (Soft Delete) ───────────────────────────────────────────────
const deleteUser = (userId, requestUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (requestUser.role !== "admin" && requestUser.id !== userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only delete your own account");
    }
    const user = yield user_model_1.User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
});
// ─── Update Block Status ──────────────────────────────────────────────────────
const updateBlockStatus = (userId, isBlocked, requestUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (requestUser.role !== "admin") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only admins can block/unblock users");
    }
    const user = yield user_model_1.User.findByIdAndUpdate(userId, { isBlocked }, { new: true }).lean();
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
});
// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = (identifier) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
        isVerified: true,
    });
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No verified account found with this phone/email");
    }
    if (user.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account is blocked");
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    yield user_model_1.Otp.findOneAndUpdate({ phone: user.phone, purpose: "forgot-password" }, { phone: user.phone, otp, expiresAt, purpose: "forgot-password" }, { upsert: true, new: true });
    return { message: "Password reset OTP sent", otp };
});
// ─── Verify Reset OTP ────────────────────────────────────────────────────────
const verifyResetOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier, otp, newPassword } = payload;
    const user = yield user_model_1.User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
        isVerified: true,
    }).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No verified account found");
    }
    const otpDoc = yield user_model_1.Otp.findOne({ phone: user.phone, purpose: "forgot-password" });
    if (!otpDoc) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No reset request found");
    }
    if (otpDoc.expiresAt < new Date()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.GONE, "OTP expired");
    }
    if (otpDoc.otp !== otp) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 12);
    user.password = hashedPassword;
    yield user.save();
    yield user_model_1.Otp.deleteOne({ _id: otpDoc._id });
    return { message: "Password reset successful" };
});
// ─── Exports ──────────────────────────────────────────────────────────────────
exports.UserService = {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    resetPassword,
    getMe,
    updateUser,
    deleteUser,
    updateBlockStatus,
    forgotPassword,
    verifyResetOtp,
};
