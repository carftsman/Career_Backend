const prisma = require("../../prisma");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { validatePassword } = require("../../utils/passwordValidator");
const { generateResetToken } = require("../../utils/generateResetToken");
const { sendResetEmail } = require("../../utils/mail");

//  Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { email }
    });

    if (!candidate) {
      return res.status(200).json({
        message: "If email exists, reset link sent"
      });
    }

    const { token, hashedToken, expiry } = generateResetToken();

    await prisma.candidate.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiry
      }
    });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendResetEmail(candidate.email, resetURL);

    return res.status(200).json({
      message: "Reset link sent to email"
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars, include uppercase, lowercase, number & special character"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const candidate = await prisma.candidate.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!candidate) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.status(200).json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// const resetPassword = async (req, res) => {
//   try {
//     const { token, newPassword, confirmPassword } = req.body;

//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({
//         message: "Passwords do not match"
//       });
//     }

//     if (!validatePassword(newPassword)) {
//       return res.status(400).json({
//         message:
//           "Password must be 8+ chars, include uppercase, lowercase, number & special character"
//       });
//     }

//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(token)
//       .digest("hex");

//     const candidate = await prisma.candidate.findFirst({
//       where: {
//         resetToken: hashedToken,
//         resetTokenExpiry: {
//           gt: new Date()
//         }
//       }
//     });

//     if (!candidate) {
//       return res.status(400).json({
//         message: "Invalid or expired token"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await prisma.candidate.update({
//       where: { id: candidate.id },
//       data: {
//         password: hashedPassword,
//         resetToken: null,
//         resetTokenExpiry: null
//       }
//     });

//     return res.status(200).json({
//       message: "Password reset successful"
//     });

//   } catch (error) {
//     console.error("RESET PASSWORD ERROR:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

module.exports = {
  forgotPassword,
  resetPassword
};