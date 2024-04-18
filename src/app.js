import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

const cors_options = {
    origin: process.env.CORS_ORIGIN,
    credentials: true
}
app.use(cors(cors_options));

const json_options = {
    limit: "16kb"
}
app.use(express.json(json_options));

const url_options = {
    extended: true,
    limit: "16kb"
}
app.use(express.urlencoded(url_options));

app.use(express.static("public"));
app.use(cookieParser());

// Importing Routes
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users", userRouter)

export {app}
