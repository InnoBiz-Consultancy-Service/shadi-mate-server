import jwt from "jsonwebtoken";
import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";
import { Otp, User } from "./user.model";
import { TLoginInput, TRegisterInput, TVerifyOtpInput } from "./user.validation";
import { envVars } from "../../../config/envConfig";
import { IUser } from "./user.interface";

// ─── Helper: generate 6-digit OTP ────────────────────────────────────────────

const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Register ────────────────────────────────────────────────────────────────

const registerUser = async (payload: TRegisterInput) => {
    const { name, email, phone, password } = payload;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        if (existingUser.email === email) {
            throw new AppError(StatusCodes.CONFLICT, "Email already registered");
        }
        if (existingUser.phone === phone) {
            throw new AppError(StatusCodes.CONFLICT, "Phone number already registered");
        }
    }

    // Create user (not yet verified)
    const user = await User.create({ name, email, phone, password });

    // Generate OTP and save
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this phone
    await Otp.deleteMany({ phone });

    await Otp.create({ phone, otp: otpCode, expiresAt });

    // TODO: Replace with real SMS gateway (e.g. Twilio, SSLCommerz notif)
    // await sendSms(phone, `Your Shadi Mate OTP is: ${otpCode}`);

    return {
        userId: user._id,
        phone: user.phone,
        message: "OTP sent to phone number (mock mode — OTP returned in response)",
        // 🔴 DEVELOPMENT ONLY — remove in production:
        otp: otpCode,
    };
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────

const verifyOtp = async (payload: TVerifyOtpInput) => {
    const { phone, otp } = payload;

    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord) {
        throw new AppError(StatusCodes.BAD_REQUEST, "OTP not found or already expired");
    }

    if (otpRecord.otp !== otp) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid OTP");
    }

    if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteOne({ phone });
        throw new AppError(StatusCodes.BAD_REQUEST, "OTP has expired. Please request a new one");
    }

    // Mark user as verified
    const user = await User.findOneAndUpdate(
        { phone },
        { isVerified: true },
        { new: true, select: "-password" }
    );

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // Delete used OTP
    await Otp.deleteOne({ phone });

    return {
        message: "Phone number verified successfully",
        user,
    };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const loginUser = async (payload: TLoginInput) => {
    const { phone, password } = payload;

    // Find user and include password for comparison
    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid phone number or password");
    }
    if (user.isBlocked) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Your account has been blocked by admin"
        );
    }
    if (!user.isVerified) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Account not verified. Please verify your phone number first"
        );
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid phone number or password");
    }

    // Sign JWT
    const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        envVars.JWT_SECRET,
        { expiresIn: envVars.JWT_EXPIRES_IN } as jwt.SignOptions
    );

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
};

// ─── Get Me ───────────────────────────────────────────────────────────────────

const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    const getUser = await User.findById(userId);
    if (!getUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    if (getUser.isDeleted) {
        throw new AppError(StatusCodes.FORBIDDEN, "Account has been deleted");
    }

    if (getUser.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
    }
    return user;
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

const resendOtp = async (phone: string) => {
    const user = await User.findOne({ phone });
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "No user found with this phone number");
    }
    if (user.isVerified) {
        throw new AppError(StatusCodes.BAD_REQUEST, "This account is already verified");
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ phone });
    await Otp.create({ phone, otp: otpCode, expiresAt });

    return {
        message: "OTP resent to phone number (mock mode — OTP returned in response)",
        otp: otpCode, // 🔴 DEVELOPMENT ONLY
    };
};
const updateUser = async (userId: string, payload: Partial<IUser>) => {
    const getUser = await User.findById(userId);
    if (!getUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    if (getUser.isDeleted) {
        throw new AppError(StatusCodes.FORBIDDEN, "Account has been deleted");
    }

    if (getUser.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked by admin");
    }
    const user = await User.findByIdAndUpdate(
        userId,
        payload,
        { new: true, runValidators: true, select: "-password" }
    );

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    return user;
};
const deleteUser = async (
    userId: string,
    requestUser: { id: string; role: string }
) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    if (user.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User already deleted");
    }

    // 🔐 Permission Logic
    if (requestUser.role !== "admin" && requestUser.id !== userId) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "You can only delete your own account"
        );
    }

    user.isDeleted = true;
    await user.save();

    return null;
};
const updateBlockStatus = async (
    userId: string,
    isBlocked: boolean,
    requestUser: { role: string }
) => {
    if (requestUser.role !== "admin") {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Only admin can block or unblock users"
        );
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    if (user.isDeleted) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Deleted user cannot be modified"
        );
    }

    user.isBlocked = isBlocked;

    await user.save();

    return user;
};
export const UserService = {
    registerUser,
    verifyOtp,
    loginUser,
    getMe,
    resendOtp,
    updateUser,
    deleteUser,
    updateBlockStatus,
};