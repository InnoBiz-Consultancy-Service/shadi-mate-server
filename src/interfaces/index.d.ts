
declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: string;
      subscription: string;
      gender: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}