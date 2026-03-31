"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.setIO = void 0;
let io;
const setIO = (ioInstance) => {
    io = ioInstance;
};
exports.setIO = setIO;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call setIO() first.");
    }
    return io;
};
exports.getIO = getIO;
