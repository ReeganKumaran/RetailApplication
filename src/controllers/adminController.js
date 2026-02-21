const Admin = require("../models/adminModel");
const { mailValidation, passwordValidation } = require("../helper/validator");
const jwt = require("jsonwebtoken");

const createAdmin = async (req, res) => {
    try {
        const { email, password, secret } = req.body;

        if (!email || !password || !secret) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"

            });
        }
        const secretKey = process.env.NO_SECRET;
        if (secret !== secretKey) {
            return res.status(400).json({
                success: false,
                message: "Invalid secret key"
            });
        }
        const emailVal = mailValidation(email);
        const passVal = passwordValidation(password);
        if (!emailVal.isValid) {
            return res.status(400).json({
                success: false,
                message: emailVal.message
            });
        }
        if (!passVal.isValid) {
            return res.status(400).json({
                success: false,
                message: passVal.message
            });
        }
        const admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists"
            });
        }
        const newAdmin = new Admin({ email, password, secret });
        await newAdmin.save();
        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: newAdmin
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        const emailVal = mailValidation(email);
        const passVal = passwordValidation(password);
        if (!emailVal.isValid) {
            return res.status(400).json({
                success: false,
                message: emailVal.message
            });
        }
        if (!passVal.isValid) {
            return res.status(400).json({
                success: false,
                message: passVal.message
            });
        }
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Admin not found"
            });
        }
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid password"
            });
        }
        const token = jwt.sign({ userRole: admin.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        return res.status(200).json({
            success: true,
            message: "Admin logged in successfully",
            data: admin,
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = {
    createAdmin,
    adminLogin
}