import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { User, Otp } from "./user.model";
import { IUser } from "./user.interface";
import { TRegisterInput, TVerifyOtpInput, TLoginInput, TForgetPasswordInput } from "./user.validation";
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

    const otpDoc = await Otp.findOne({ phone, purpose: "registration" });
    if (!otpDoc) {
        throw new AppError(StatusCodes.NOT_FOUND, "No pending registration found for this phone number");
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new AppError(StatusCodes.GONE, "OTP has expired. Please register again or use resend-otp");
    }

    if (otpDoc.otp !== otp) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
    }

    // Log the userData before creating user
    console.log("🟢 OTP userData:", otpDoc.userData);
    console.log("🟢 Password from OTP:", otpDoc.userData?.password);

    // ✅ Use the hashed password stored in OTP directly
    const userData = {
        name: otpDoc.userData?.name,
        email: otpDoc.userData?.email,
        phone: otpDoc.userData?.phone,
        password: otpDoc.userData?.password, // This is already hashed
        gender: otpDoc.userData?.gender,
        isVerified: true
    };

    const user = await User.create(userData);
    
    // Verify the user was created with the hashed password
    const createdUser = await User.findById(user._id).select("+password");
    console.log("🟢 Created user password hash:", createdUser?.password);

    await Otp.deleteOne({ _id: otpDoc._id });

    // Generate JWT token for auto-login
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

    console.log("🟡 Login attempt for identifier:", identifier);
    console.log("🟡 Provided password:", password);

    // Find user by phone or email
    const user = await User.findOne({
        $or: [{ phone: identifier }, { email: identifier }],
        isDeleted: false,
    }).select("+password");

    if (!user) {
        console.log("🟡 User not found");
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid phone/email or password");
    }

    if (user.isBlocked) {
        throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
    }

    if (!user.isVerified) {
        throw new AppError(StatusCodes.FORBIDDEN, "Please verify your phone/email first");
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🟡 Password match result:", isMatch);

    if (!isMatch) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid phone/email or password");
    }

    // Generate JWT token
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
};

// ─── Forget Password (New Function) ───────────────────────────────────────────
const forgetPassword = async (payload: TForgetPasswordInput) => {
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

// ─── Exports ──────────────────────────────────────────────────────────────────
export const UserService = {
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