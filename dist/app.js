"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const globalErrorHandler_1 = require("./middleWares/globalErrorHandler");
const notFound_1 = require("./middleWares/notFound");
const index_1 = require("./app/routes/index ");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/api/v1", index_1.router);
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to Shadi Mate  Server"
    });
});
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.notFoundHandler);
exports.default = app;
