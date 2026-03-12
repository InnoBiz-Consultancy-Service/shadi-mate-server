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
    console.log("🔵 Registration attempt for phone:", phone);
    console.log("🔵 Original password:", password);
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
    // Save hashed password in OTP temporarily
    const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
    console.log("🔵 Hashed password:", hashedPassword);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    yield user_model_1.Otp.create({
        phone,
        otp,
        expiresAt,
        purpose: "registration", // পারপাস সেট করুন
        userData: {
            name,
            email,
            phone,
            password: hashedPassword,
            gender
        },
    });
    return {
        message: "OTP sent successfully. Please verify your phone number.",
        phone,
        otp, // 🔴 DEVELOPMENT ONLY, remove in production
    };
});
// ─── Verify OTP & Auto-login ─────────────────────────────────────────────────
const verifyOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { phone, otp } = payload;
    console.log("🟢 Verifying OTP for phone:", phone);
    const otpDoc = yield user_model_1.Otp.findOne({ phone, purpose: "registration" });
    if (!otpDoc) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "No pending registration found for this phone number");
    }
    if (otpDoc.expiresAt < new Date()) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.GONE, "OTP has expired. Please register again or use resend-otp");
    }
    if (otpDoc.otp !== otp) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }
    // Log the userData before creating user
    console.log("🟢 OTP userData:", otpDoc.userData);
    console.log("🟢 Password from OTP:", (_a = otpDoc.userData) === null || _a === void 0 ? void 0 : _a.password);
    // ✅ Use the hashed password stored in OTP directly
    const userData = {
        name: (_b = otpDoc.userData) === null || _b === void 0 ? void 0 : _b.name,
        email: (_c = otpDoc.userData) === null || _c === void 0 ? void 0 : _c.email,
        phone: (_d = otpDoc.userData) === null || _d === void 0 ? void 0 : _d.phone,
        password: (_e = otpDoc.userData) === null || _e === void 0 ? void 0 : _e.password, // This is already hashed
        gender: (_f = otpDoc.userData) === null || _f === void 0 ? void 0 : _f.gender,
        isVerified: true
    };
    const user = yield user_model_1.User.create(userData);
    // Verify the user was created with the hashed password
    const createdUser = yield user_model_1.User.findById(user._id).select("+password");
    console.log("🟢 Created user password hash:", createdUser === null || createdUser === void 0 ? void 0 : createdUser.password);
    yield user_model_1.Otp.deleteOne({ _id: otpDoc._id });
    // Generate JWT token for auto-login
    const token = jsonwebtoken_1.default.sign({
        id: user._id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        isVerified: user.isVerified,
    }, envConfig_1.envVars.JWT_SECRET, { expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN });
    return {
        message: "Phone verified successfully. Account created!",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            role: user.role,
            isVerified: user.isVerified,
        },
        token, // ✅ Auto-login token
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
    console.log("🟡 Login attempt for identifier:", identifier);
    console.log("🟡 Provided password:", password);
    // Find user by phone or email
    const user = yield user_model_1.User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");
    if (!user) {
        console.log("🟡 User not found");
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid phone/email or password");
    }
    if (user.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify your phone/email first");
    }
    // Compare passwords
    const isMatch = yield bcryptjs_1.default.compare(password, user.password);
    console.log("🟡 Password match result:", isMatch);
    if (!isMatch) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid phone/email or password");
    }
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({
        id: user._id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        isVerified: user.isVerified,
    }, envConfig_1.envVars.JWT_SECRET, { expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN });
    return {
        message: "Login successful",
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            isVerified: user.isVerified,
        },
    };
});
// ─── Forget Password (New Function) ───────────────────────────────────────────
const forgetPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier, oldPassword, newPassword } = payload;
    console.log("🟣 Forget password attempt for identifier:", identifier);
    // Find user by phone or email
    const user = yield user_model_1.User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");
    if (!user) {
        console.log("🟣 User not found");
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Account not found with this phone/email");
    }
    if (user.isBlocked) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
    }
    if (!user.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify your account first");
    }
    // Verify old password
    const isOldPasswordMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
    console.log("🟣 Old password match result:", isOldPasswordMatch);
    if (!isOldPasswordMatch) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Current password is incorrect");
    }
    // Hash the new password
    const hashedNewPassword = yield bcryptjs_1.default.hash(newPassword, 12);
    console.log("🟣 New password hashed successfully");
    // Update password in database
    user.password = hashedNewPassword;
    yield user.save();
    console.log("🟣 Password updated successfully for user:", user.phone);
    // Generate new token for auto-login (optional)
    const token = jsonwebtoken_1.default.sign({
        id: user._id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isProfileCompleted: user.isProfileCompleted,
        isVerified: user.isVerified,
    }, envConfig_1.envVars.JWT_SECRET, { expiresIn: envConfig_1.envVars.JWT_EXPIRES_IN });
    return {
        message: "Password changed successfully. Please login with your new password.",
        token, // Optional: auto-login after password change
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
// ─── Exports ──────────────────────────────────────────────────────────────────
exports.UserService = {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    forgetPassword,
    getMe,
    updateUser,
    deleteUser,
    updateBlockStatus,
};
