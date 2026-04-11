import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { User, Otp } from "./user.model";
import { IUser } from "./user.interface";
import {
    TRegisterInput,
    TVerifyOtpInput,
    TLoginInput,
    TResetPasswordInput,
} from "./user.validation";
import {
    buildTokenPayload,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    blacklistAccessToken,
    verifyAccessToken,
} from "../../../utils/token.utils";
import { invalidateUserCache } from "./user.cache";

// ─── Helper: Generate 6-digit OTP ─────────────────────────────────────────────
const generateOtp = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MINUTES = 5;

// ─── Helper: Issue both tokens ────────────────────────────────────────────────
const issueTokens = async (user: {
    _id: unknown;
    role: string;
    isVerified: boolean;
    isProfileCompleted: boolean;
    subscription: string;
}) => {
    const payload = buildTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload.id);
    return { accessToken, refreshToken };
};

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async (payload: TRegisterInput) => {
    const { name, email, phone, password, gender } = payload;

    const [existingUser, existingOtp] = await Promise.all([
        User.findOne({ phone }, "_id").lean(),
        Otp.findOne({ phone }, "_id").lean(),
    ]);

    if (existingUser) {
        throw new AppError(StatusCodes.CONFLICT, "Phone number already registered");
    }

    if (existingOtp) {
        throw new AppError(
            StatusCodes.CONFLICT,
            "OTP already sent to this number. Please verify or use resend-otp"
        );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({
        phone,
        otp,
        expiresAt,
        purpose: "registration",
        userData: { name, email, phone, password: hashedPassword, gender },
    });

    return {
        message: "OTP sent successfully. Please verify your phone number.",
        phone,
        otp, // 🔴 DEVELOPMENT ONLY — remove in production
    };
};

// ─── Verify OTP & Auto-login ─────────────────────────────────────────────────
const verifyOtp = async (payload: TVerifyOtpInput) => {
    const { phone, otp } = payload;

    const otpDoc = await Otp.findOne({ phone, purpose: "registration" });

    if (!otpDoc) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "No pending registration found for this phone number"
        );
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new AppError(StatusCodes.GONE, "OTP expired. Please register again");
    }

    if (otpDoc.otp !== otp) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }

    const user = await User.create({ ...otpDoc.userData, isVerified: true });
    await Otp.deleteOne({ _id: otpDoc._id });

    const { accessToken, refreshToken } = await issueTokens({
        _id: user._id,
        role: user.role,
        isVerified: user.isVerified,
        isProfileCompleted: user.isProfileCompleted ?? false,
        subscription: user.subscription,
    });

    return {
        message: "Phone verified successfully. Account created!",
        accessToken,
        refreshToken,
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
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = async (phone: string) => {
    const newOtp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const updated = await Otp.findOneAndUpdate(
        { phone, purpose: "registration" },
        { otp: newOtp, expiresAt },
        { new: true }
    );

    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "No pending registration found for this phone number. Please register first"
        );
    }

    return {
        message: "OTP resent successfully.",
        otp: newOtp, // 🔴 DEVELOPMENT ONLY
    };
};

// ─── Login ────────────────────────────────────────────────────────────────────
const loginUser = async (payload: TLoginInput) => {
    const { identifier, password } = payload;

    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");

    if (user) {
        if (user.isBlocked) {
            throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
        }

        if (!user.isVerified) {
            throw new AppError(StatusCodes.FORBIDDEN, "Please verify your account first");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
        }

        const { accessToken, refreshToken } = await issueTokens({
            _id: user._id,
            role: user.role,
            isVerified: user.isVerified,
            isProfileCompleted: user.isProfileCompleted ?? false,
            subscription: user.subscription,
        });

        return { message: "Login successful", accessToken, refreshToken, user };
    }

    // ─── Pending OTP user ───────────────────────────────────────────────────
    const otpDoc = await Otp.findOne({
        $or: [{ phone: identifier }, { "userData.email": identifier }],
        purpose: "registration",
    });

    if (!otpDoc) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Account not found");
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new AppError(StatusCodes.GONE, "OTP expired. Please register again");
    }

    const isMatch = await bcrypt.compare(password, otpDoc.userData.password);

    if (!isMatch) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }

    // Pending users: short-lived access token only, no refresh token
    const accessToken = signAccessToken({
        id: "pending",
        role: "user",
        isVerified: false,
        isProfileCompleted: false,
        subscription: "free",
    });

    return {
        message: "Login successful (pending verification)",
        accessToken,
        refreshToken: null,
        user: {
            name: otpDoc.userData.name,
            email: otpDoc.userData.email,
            phone: otpDoc.userData.phone,
            gender: otpDoc.userData.gender,
            isVerified: false,
            subscription: "free",
        },
    };
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────
const refreshAccessToken = async (userId: string, refreshToken: string) => {
    const user = await User.findById(userId).lean();

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    if ((user as any).isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
    }

    if ((user as any).isDeleted) {
        throw new AppError(StatusCodes.FORBIDDEN, "Account no longer exists");
    }

    const isValid = await verifyRefreshToken(userId, refreshToken);

    if (!isValid) {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            "Invalid or expired refresh token. Please login again"
        );
    }

    const newRefreshToken = await rotateRefreshToken(userId);

    // ✅ Fresh payload from DB — always up-to-date
    const newAccessToken = signAccessToken(buildTokenPayload(user as any));

    return {
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logoutUser = async (accessToken: string, userId: string) => {
    try {
        const decoded = verifyAccessToken(accessToken);

        if (decoded.exp) {
            const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
            if (remainingTTL > 0) {
                const jti = accessToken.split(".")[2];
                await blacklistAccessToken(jti, remainingTTL);
            }
        }
    } catch {
        // Token already expired — no need to blacklist
    }

    await Promise.all([
        revokeRefreshToken(userId),
        invalidateUserCache(userId), // ✅ Clear cache on logout
    ]);

    return { message: "Logged out successfully" };
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (payload: TResetPasswordInput) => {
    const { identifier, oldPassword, newPassword } = payload;

    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "Account not found with this phone/email");
    }

    if (user.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
    }

    if (!user.isVerified) {
        throw new AppError(StatusCodes.FORBIDDEN, "Please verify your account first");
    }

    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordMatch) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    await Promise.all([
        revokeRefreshToken(String(user._id)),
        invalidateUserCache(String(user._id)), // ✅ Clear cache
    ]);

    const { accessToken, refreshToken } = await issueTokens({
        _id: user._id,
        role: user.role,
        isVerified: user.isVerified,
        isProfileCompleted: user.isProfileCompleted ?? false,
        subscription: user.subscription,
    });

    return {
        message: "Password changed successfully.",
        accessToken,
        refreshToken,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
        },
    };
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = async (userId: string) => {
    const user = await User.findById(userId).lean();
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
};

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = async (userId: string, payload: Partial<IUser>) => {
    const user = await User.findByIdAndUpdate(userId, payload, {
        new: true,
        runValidators: true,
    }).lean();

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // ✅ Any profile update → invalidate cache
    // e.g. isProfileCompleted true হলে সাথে সাথে reflect হবে
    await invalidateUserCache(userId);

    return user;
};

// ─── Delete User (Soft Delete) ───────────────────────────────────────────────
const deleteUser = async (
    userId: string,
    requestUser: { id: string; role: string }
) => {
    if (requestUser.role !== "admin" && requestUser.id !== userId) {
        throw new AppError(StatusCodes.FORBIDDEN, "You can only delete your own account");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { isDeleted: true },
        { new: true }
    );

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // ✅ Delete করলে তাৎক্ষণিক সব session শেষ
    await Promise.all([
        revokeRefreshToken(userId),
        invalidateUserCache(userId),
    ]);

    return user;
};

// ─── Update Block Status ──────────────────────────────────────────────────────
const updateBlockStatus = async (
    userId: string,
    isBlocked: boolean,
    requestUser: { id: string; role: string }
) => {
    if (requestUser.role !== "admin") {
        throw new AppError(StatusCodes.FORBIDDEN, "Only admins can block/unblock users");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { isBlocked },
        { new: true }
    ).lean();

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // ✅ Block হলে তাৎক্ষণিক পরের request-এই reject হবে
    await Promise.all([
        invalidateUserCache(userId),
        ...(isBlocked ? [revokeRefreshToken(userId)] : []),
    ]);

    return user;
};

// ─── Update Subscription ──────────────────────────────────────────────────────
// ✅ এই service টা payment/subscription module থেকে call করতে হবে
// যখনই subscription পরিবর্তন হবে — premium কেনা, cancel, expire
const updateSubscription = async (userId: string, subscription: string) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { subscription },
        { new: true }
    ).lean();

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // ✅ Cache invalidate — পরের request থেকেই নতুন subscription দেখাবে
    // কোনো re-login লাগবে না
    await invalidateUserCache(userId);

    return user;
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (identifier: string) => {
    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
        isVerified: true,
    });

    if (!user) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "No verified account found with this phone/email"
        );
    }

    if (user.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account is blocked");
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.findOneAndUpdate(
        { phone: user.phone, purpose: "forgot-password" },
        { phone: user.phone, otp, expiresAt, purpose: "forgot-password" },
        { upsert: true, new: true }
    );

    return { message: "Password reset OTP sent", otp };
};

// ─── Verify Reset OTP ────────────────────────────────────────────────────────
const verifyResetOtp = async (payload: {
    identifier: string;
    otp: string;
    newPassword: string;
}) => {
    const { identifier, otp, newPassword } = payload;

    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
        isVerified: true,
    }).select("+password");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "No verified account found");
    }

    const otpDoc = await Otp.findOne({
        phone: user.phone,
        purpose: "forgot-password",
    });

    if (!otpDoc) {
        throw new AppError(StatusCodes.NOT_FOUND, "No reset request found");
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new AppError(StatusCodes.GONE, "OTP expired");
    }

    if (otpDoc.otp !== otp) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    await Otp.deleteOne({ _id: otpDoc._id });

    // ✅ সব session revoke + cache clear
    await Promise.all([
        revokeRefreshToken(String(user._id)),
        invalidateUserCache(String(user._id)),
    ]);

    return { message: "Password reset successful. Please login again." };
};

// ─── Exports ──────────────────────────────────────────────────────────────────
export const UserService = {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    refreshAccessToken,
    logoutUser,
    resetPassword,
    getMe,
    updateUser,
    updateSubscription,
    deleteUser,
    updateBlockStatus,
    forgotPassword,
    verifyResetOtp,
};