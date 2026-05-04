"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriberValidationSchema = void 0;
const zod_1 = require("zod");
exports.subscriberValidationSchema = zod_1.z.object({
    email: zod_1.z.string()
        .email("Invalid email format"),
});
