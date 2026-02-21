const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ["ADMIN", "STAFF"]
    }
})

adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const isBcyptHash = (str) => typeof str === "string" && /^$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
        if (isBcyptHash(this.password)) {
            return next();
        }
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        return next(error)
    }
});

adminSchema.methods.comparePassword = async function (adminPassword) {
    try {
        return await bcrypt.compare(adminPassword, this.password);
    }
    catch (error) {
        throw new Error("Password comparison faild");
    }
}

module.exports = mongoose.model("Admin", adminSchema)