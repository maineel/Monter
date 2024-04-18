import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'thelma31@ethereal.email',
        pass: '6yE3AhsMhTJPnrN7jE'
    }
});

// User API Endpoints
const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new APIError(400, "All fields are required");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new APIError(409, "User already exists");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const mailOptions = {
    from: "neel.s2@ahduni.edu.in",
    to: email,
    subject: "OTP for account verification",
    text: `Your OTP for account verification is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} with OTP ${otp}`);
  } catch (error) {
    console.error(error);
  }

  const user = await User.create({
    email,
    password,
    otp,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -fullName -age -location -workDetails -otp -createdAt -updatedAt -__v"
  );

  if (!createdUser) {
    throw new APIError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new APIResponse(200, createdUser, "User registered sucessfully"));
});

const verifyUser = asyncHandler(async (req, res) => {
  const { email, otp, location, age, workDetails } = req.body;

  if (!email || !otp) {
    throw new APIError(400, "Email and OTP are required");
  }
  const user = await User.findOne({ email });
  if (user.otp == otp) {
    user.location = location;
    user.age = age;
    user.workDetails = workDetails;

    await User.updateOne({ _id: user._id }, { 
        $set: { user },
        $unset: { otp: 1 } 
    });
    await user.save({ validateBeforeSave: false });
  } 
  else {
    await User.deleteOne({ _id: user._id });
    throw new APIError(400, "Invalid OTP.  Please register again"); 
  }

  return res.status(200).json(new APIResponse(200, {}, "User verified"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new APIError(400, "username and password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new APIError(404, "User does not exist");
  }

  const passwordCorrect = await user.isPasswordCorrect(password);
  if (!passwordCorrect) {
    throw new APIError(401, "Password Incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -otp -createdAt -updatedAt -__v"
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully!"
      )
    );
});

const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -otp -createdAt -updatedAt -__v"
  );

  if (!user) {
    throw new APIError(404, "User not found");
  }

  return res
    .status(200)
    .json(new APIResponse(200, user, "User details fetched successfully"));
});

export { registerUser, loginUser, verifyUser, getUserDetails };
