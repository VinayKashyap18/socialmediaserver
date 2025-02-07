import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { hashString } from "./index.js";
import Verification from "../models/emailVerification.js";
import PasswordReset from "../models/PasswordReset.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;

let transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    auth: {
        user: AUTH_EMAIL,
        pass: AUTH_PASSWORD,
    },
});

export const sendVerificationEmail = async(user, res) => {
    const { _id, email, firstName } = user;
    
    const token = _id + uuidv4();

    const link = APP_URL + "users/verify/" + _id + "/" + token;

    //mail options
    const mailOptions = {
        from: AUTH_EMAIL,
        to: email,
        subject: "Email Verification",

        html: `<div style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color:#d5d4d4;'> <h1 style="color: rgb(255,127,80);"> Please verify your email</h1>
        <hr>
        <h4>Hi ${firstName},</h4>
        <p>Welcome to our Social Media Platform</p>
        <p>Please verify your email address so we can know that it's really you
        <p>
          <br>
        <p>This link <b>expires in 1 hour</b></p>
        <br>
        <a href=${link} style="color: #fff; padding: 10px; text-decoration: none; background-color: #000;">Verify Email
          Address</a>
      
        <div style="margin-top: 20px;">
          <h5>Best Regards</h5>
          <h5>Team Photo Pulse</h5>
        </div>
      </div>
      `,
    };  

    try {
        const hashedToken = await hashString(token);

        const newVerifiedEmail = await Verification.create({
            userId: _id,
            token: hashedToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        });

        if (newVerifiedEmail){
            transporter.sendMail(mailOptions).then(()=>{
                res.status(201).send({
                    success: "PENDING",
                    message: "Verification email has been sent to your account. Check your email for further instructions.",
                })
            }).catch((err)=>{
                console.log(err);
                res.status(404).json({message: "Something went wrong"});
            })
        }

    } catch (error) {
        console.log(error);
        res.status(400).json({message: error.message});
    }
};


export const resetPasswordLink = async(user, res) => {
    const { _id, email } = user;

    const token = _id + uuidv4();
    const link = APP_URL + "users/reset-password/" + _id + "/" + token;

    //mail options

    const mailOptions = {
        from: AUTH_EMAIL,
        to: email,
        subject: "Password Reset",
        html: `<p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; background-color: white;"> Password reset link. Please click the link below to reset password.
        <br>
        <p style="font-size: 18px;"><b>This link expires in 10 minutes</b></p>
        <br>
        <a href=${link} style="color: #fff; padding: 10px; text-decoration: none; background-color: black;"</a>
        Reset Password</p>`,
    }

    try {
        const hashedToken = await hashString(token);

        const resetEmail = await PasswordReset.create({
            userId: _id,
            token: hashedToken,
            emai: email,
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000,
        });

        if (resetEmail){
            transporter.sendMail(mailOptions).then(()=>{
                res.status(201).send({
                    success: "PENDING",
                    message: "Reset password link has been sent to your account.",
                });
            }).catch((err)=>{
                console.log(err);
                res.status(404).json({message: "Something went wrong"});
            })
        }

    } catch (error) {
        console.log(error);
        res.status(404).json({message: "Something went wrong"});
    }
}
