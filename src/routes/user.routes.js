import { Router } from "express";
import { registerUser,
    loginUser,
    verifyUser,
    getUserDetails } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/verify").post(verifyUser)

// Secured route
router.route("/get-user").get(verifyJWT, getUserDetails)

export default router;