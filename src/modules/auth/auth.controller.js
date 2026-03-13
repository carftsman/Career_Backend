const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authService = require("./auth.service");

exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }
    
    // Allow only dhatvibs.com domain
    if (!email.endsWith("@dhatvibs.com")) {
      return res.status(403).json({
        message: "Only dhatvibs.com emails are allowed"
      });
    }
    
    const user = await authService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });

  }
};