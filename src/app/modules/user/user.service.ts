import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { User, Otp } from "./user.model";
import { IUser } from "./user.interface";
import { TRegisterInput, TVerifyOtpInput, TLoginInput, TResetPasswordInput } from "./user.validation";
import { envVars } from "../../../config/envConfig";

// ─── Helper: Generate 6-digit OTP ─────────────────────────────────────────────
const generateOtp = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MINUTES = 5;

// ─── Register ─────────────────────────────────────────────────────────────────
const registerUser = async (payload: TRegisterInput) => {
    const { name, email, phone, password, gender } = payload;

    console.log("🔵 Registration attempt for phone:", phone);
    console.log("🔵 Original password:", password);

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

    // Save hashed password in OTP temporarily
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("🔵 Hashed password:", hashedPassword);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.create({
        phone,
        otp,
        expiresAt,
        purpose: "registration",
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
};

// ─── Verify OTP & Auto-login ─────────────────────────────────────────────────
const verifyOtp = async (payload: TVerifyOtpInput) => {
    const { phone, otp } = payload;

    console.log("🟢 Verifying OTP for phone:", phone);

    // OTP খুঁজে বের করা
    const otpDoc = await Otp.findOne({
        phone,
        purpose: "registration",
    });

    if (!otpDoc) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "No pending registration found for this phone number"
        );
    }

    // OTP expire check
    if (otpDoc.expiresAt < new Date()) {
        throw new AppError(
            StatusCodes.GONE,
            "OTP expired. Please register again"
        );
    }

    // OTP match check
    if (otpDoc.otp !== otp) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }

    // userData থেকে user create
    const user = await User.create({
        ...otpDoc.userData,
        isVerified: true,
    });

    // OTP delete
    await Otp.deleteOne({ _id: otpDoc._id });

    // JWT token generate
    const token = jwt.sign(
        {
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isProfileCompleted: user.isProfileCompleted,
        },
        envVars.JWT_SECRET as string,
        {
            expiresIn: envVars.JWT_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d"}`,
        }
    );

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

    console.log("🟡 Login attempt:", identifier);

    // ───── 1️⃣ Check verified users ─────

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

        const token = jwt.sign(
            {
                id: user._id,
                phone: user.phone,
                email: user.email,
                role: user.role,
                isProfileCompleted: user.isProfileCompleted,
                isVerified: user.isVerified,
            },
            envVars.JWT_SECRET as string,
            {
                expiresIn: envVars.JWT_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d"}`,
            }
        );

        return {
            message: "Login successful",
            token,
            user,
        };
    }

    // ───── 2️⃣ Check OTP pending users ─────

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

    const token = jwt.sign(
        {
            phone: otpDoc.userData.phone,
            email: otpDoc.userData.email,
            role: "user",
            gender: otpDoc.userData.gender,
            isVerified: false,
            pendingRegistration: true,
        },
        envVars.JWT_SECRET as string,
        {
            expiresIn: envVars.JWT_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d"}`,
        }
    );

    return {
        message: "Login successful (pending verification)",
        token,
        user: {
            name: otpDoc.userData.name,
            email: otpDoc.userData.email,
            phone: otpDoc.userData.phone,
            gender: otpDoc.userData.gender,
            isVerified: false,
        },
    };
};

// ─── Forget Password (New Function) ───────────────────────────────────────────
const resetPassword = async (payload: TResetPasswordInput) => {
    const { identifier, oldPassword, newPassword } = payload;

    console.log("🟣 Forget password attempt for identifier:", identifier);

    // Find user by phone or email
    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");

    if (!user) {
        console.log("🟣 User not found");
        throw new AppError(StatusCodes.NOT_FOUND, "Account not found with this phone/email");
    }

    if (user.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
    }

    if (!user.isVerified) {
        throw new AppError(StatusCodes.FORBIDDEN, "Please verify your account first");
    }

    // Verify old password
    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    console.log("🟣 Old password match result:", isOldPasswordMatch);

    if (!isOldPasswordMatch) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Current password is incorrect");
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    console.log("🟣 New password hashed successfully");

    // Update password in database
    user.password = hashedNewPassword;
    await user.save();

    console.log("🟣 Password updated successfully for user:", user.phone);

    // Generate new token for auto-login (optional)
    const token = jwt.sign(
        {
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            isVerified: user.isVerified,
        },
        envVars.JWT_SECRET,
        { expiresIn: envVars.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}` }
    );

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
    const user = await User.findByIdAndUpdate(
        userId,
        payload,
        { new: true, runValidators: true }
    ).lean();

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    return user;
};

// ─── Delete User (Soft Delete) ───────────────────────────────────────────────
const deleteUser = async (userId: string, requestUser: { id: string; role: string }) => {
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
    return user;
};

// ─── Update Block Status ──────────────────────────────────────────────────────
const updateBlockStatus = async (userId: string, isBlocked: boolean, requestUser: { id: string; role: string }) => {
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
    return user;
};
// ─── Forgot Password (verified users only) ─────────────────────────────
const forgotPassword = async (identifier: string) => {
    // Find verified user
    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
        isVerified: true, // only verified users
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "No verified account found with this phone/email");
    }

    if (user.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account is blocked");
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.findOneAndUpdate(
        { phone: user.phone, purpose: "forgot-password" },
        {
            phone: user.phone,
            otp,
            expiresAt,
            purpose: "forgot-password"
        },
        { upsert: true, new: true }
    );

    return {
        message: "Password reset OTP sent",
        otp, // dev only
    };
};

// ─── Verify Reset OTP (verified users only) ────────────────────────────
const verifyResetOtp = async (payload: {
    identifier: string;
    otp: string;
    newPassword: string;
}) => {
    const { identifier, otp, newPassword } = payload;

    // Only look for verified users
    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
        isVerified: true
    }).select("+password");

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "No verified account found");
    }

    const otpDoc = await Otp.findOne({
        phone: user.phone,
        purpose: "forgot-password"
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

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    // delete OTP after successful reset
    await Otp.deleteOne({ _id: otpDoc._id });

    return {
        message: "Password reset successful"
    };
};
// ─── Exports ──────────────────────────────────────────────────────────────────
export const UserService = {
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