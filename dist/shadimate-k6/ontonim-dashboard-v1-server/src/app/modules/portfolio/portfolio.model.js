"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const mongoose_1 = require("mongoose");
const projectSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        minlength: [10, "Description must be at least 10 characters long"],
        maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    technologies: {
        type: [String],
        required: [true, "Technologies are required"],
        validate: {
            validator: function (arr) {
                return arr.length > 0 && arr.every((tech) => tech.trim().length > 0);
            },
            message: "At least one valid technology is required"
        }
    },
    services: {
        type: [String],
        required: [true, "Services are required"],
        validate: {
            validator: function (arr) {
                return arr.length > 0 && arr.every((service) => service.trim().length > 0);
            },
            message: "At least one valid service is required"
        }
    },
    liveURL: {
        type: String,
        required: [true, "Live URL is required"],
        trim: true,
        validate: {
            validator: function (url) {
                return /^https?:\/\/.+/.test(url);
            },
            message: "Live URL must be a valid URL"
        }
    },
    caseStudyURL: {
        type: String,
        trim: true,
        validate: {
            validator: function (url) {
                if (!url || url === "")
                    return true;
                return /^https?:\/\/.+/.test(url);
            },
            message: "Case study URL must be a valid URL"
        }
    },
    imageURL: {
        type: String,
        required: [true, "Image URL is required"],
        trim: true,
        validate: {
            validator: function (url) {
                return /^https?:\/\/.+/.test(url);
            },
            message: "Image URL must be a valid URL"
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
    versionKey: false
});
// Index for faster queries
projectSchema.index({ createdAt: -1 });
exports.Project = (0, mongoose_1.model)("Project", projectSchema);
