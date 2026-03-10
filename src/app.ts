import cors from "cors";
import express, { Request, Response } from "express";
import { globalErrorHandler } from "./middleWares/globalErrorHandler";
import { notFoundHandler } from "./middleWares/notFound";
import cookieParser from "cookie-parser";

import { router } from "./app/routes/index ";

const app = express()

app.use(express.json())
app.use(cors())

app.use(cookieParser());
app.use("/api/v1", router)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to Shadi Mate  Server"
    })
})


app.use(globalErrorHandler)

app.use(notFoundHandler)

export default app