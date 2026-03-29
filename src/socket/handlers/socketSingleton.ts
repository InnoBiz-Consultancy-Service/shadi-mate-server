import { Server } from "socket.io";



let io: Server;

export const setIO = (ioInstance: Server) => {
    io = ioInstance;
};

export const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call setIO() first.");
    }
    return io;
};