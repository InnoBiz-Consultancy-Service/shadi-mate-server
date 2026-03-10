import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { User, Otp } from "./user.model";
import { IUser } from "./user.interface";
import { TRegisterInput, TVerifyOtpInput, TLoginInput } from "./user.validation";
import { envVars } from "../../../config/envConfig";

// ─── Helper: Generate 6-digit OTP ─────────────────────────────────────────────

const generateOtp = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MINUTES = 5;

// ─── Register ─────────────────────────────────────────────────────────────────


const registerUser = async (payload: TRegisterInput) => {
    const { name, email, phone, password, gender } = payload;

    // 1️⃣ User ও pending OTP একসাথে parallel এ check করো — 2টা query একই time এ চলবে
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
        userData: { name, email, phone, password: hashedPassword, gender },
    });

    return {
        message: "OTP sent successfully. Please verify your phone number.",
        phone,
        otp,
    };
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────

const verifyOtp = async (payload: TVerifyOtpInput) => {
    const { phone, otp } = payload;

    const otpDoc = await Otp.findOne({ phone });
    if (!otpDoc) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "No pending registration found for this phone number"
        );
    }

    // 2️⃣ Expired?
    if (otpDoc.expiresAt < new Date()) {
        throw new AppError(
            StatusCodes.GONE,
            "OTP has expired. Please register again or use resend-otp"
        );
    }

    if (otpDoc.otp !== otp) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }

    // OTP valid — User create ও OTP delete একসাথে parallel এ চলবে
    const [user] = await Promise.all([
        User.create({ ...otpDoc.userData, isVerified: true }),
        Otp.deleteOne({ _id: otpDoc._id }), // _id দিয়ে delete → index hit, fastest
    ]);

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
    };
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

const resendOtp = async (phone: string) => {
    const newOtp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);


    const updated = await Otp.findOneAndUpdate(
        { phone },
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
    const { phone, password } = payload;

    const user = await User.findOne({ phone, isDeleted: false }).select("+password");
    if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid phone or password");
    }

    if (user.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
    }

    if (!user.isVerified) {
        throw new AppError(StatusCodes.FORBIDDEN, "Please verify your phone number first");
    }

    // 2️⃣ Password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid phone or password");
    }

    const token = jwt.sign(
        {
            id: user._id,
            phone: user.phone,
            role: user.role,
            isProfileCompleted: user.isProfileCompleted,
            isVerified: user.isVerified,

        },
        envVars.JWT_SECRET,
        { expiresIn: envVars.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}` }
    );

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
    return user;
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const UserService = {
    registerUser,
    verifyOtp,
    resendOtp,
    loginUser,
    getMe,
    updateUser,
    deleteUser,
    updateBlockStatus,
};

