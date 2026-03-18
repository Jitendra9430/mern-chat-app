const User = require('../models/user');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Register User
exports.registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        const userExists = await User.findOne({email});

        if(userExists) {
            return res.status(400).json({message: "User already exists"}); 
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });
        res.status(201).json(user);
    } catch(error) {
        res.status(500).json({message: "Server Error"});
    }
};

//Login

exports.loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});

        if(!user) {
            return res.status(400).json ({message: "Invalid Credentials"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status (400).json({message: "Invalid Credentials"}); 
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "7d",});

        res.json({
            token,
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server Error"});
    }
};