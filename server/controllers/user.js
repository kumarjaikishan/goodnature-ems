const user = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { addtoqueue } = require('../utils/axiosRequest');
const { logActivity } = require('../utils/auditLogger');

const userRegister = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) {
      return next({ status: 400, message: "all fields are required" });
    }
    const checkemail = await user.findOne({ email });
    if (checkemail) {
      return next({ status: 400, message: "Email Already Exists" });
    }
    const query = new user({ name, email, role, password });
    const result = await query.save();
    if (!result) {
      return next({ status: 400, message: "Something went wrong" });
    }

    res.status(200).json({
      message: 'User Created Successfully'
    })

  } catch (error) {
    console.log(error.message)
    return next({ status: 500, message: error.message });
  }
}
const userLogin = async (req, res, next) => {
  const { email, password, loginType } = req.body;
  const rawIdentifier = email?.trim() || req.body.identifier?.trim();

  if (!rawIdentifier || !password) {
    return next({ status: 400, message: "Login ID and password are required" });
  }
  try {
    const isUser = await user.findOne({
      $or: [
        { email: rawIdentifier.toLowerCase() },
        { email: rawIdentifier },
        { sponsorCode: rawIdentifier.toUpperCase() },
        { customerId: rawIdentifier.toUpperCase() },
        { mobile: rawIdentifier }
      ]
    });
    // console.log("inlogin", isUser)
    if (!isUser) {
      return next({ status: 400, message: "Account not found with provided ID / Email / Mobile" });
    }

    if (isUser.role === 'customer') {
      return next({ status: 403, message: "Customer accounts cannot log in to the portal." });
    }

    if (isUser.isBlocked) {
      return next({ status: 403, message: "Your account is blocked. Please contact administrator." });
    }

    const passwordMatch = await bcrypt.compare(password, isUser.password);
    if (!passwordMatch) {
      return next({ status: 400, success: false, message: "Password is incorrect" });
    }

    let tobe = {
      id: isUser._id,
      name: isUser.name,
      role: isUser.role,
      profileImage: isUser.profileImage,
      email: isUser.email,
      sponsorCode: isUser.sponsorCode || isUser.customerId || '',
      isDeveloperSponsor: Boolean(isUser.isDeveloperSponsor || !isUser.sponsorId),
      isBranchPartner: Boolean(isUser.isBranchPartner)
    }
    if (isUser.role !== 'admin' && isUser.role !== 'superadmin') {
      tobe.employeeId = isUser.employeeId;
    }
    if (isUser.permissions) {
      tobe.permissions = isUser.permissions;
    }
    if (isUser.branchIds && isUser.branchIds.length > 0) {
      tobe.branchIds = isUser.branchIds;
    }
    if (isUser.companyId) {
      tobe.companyId = isUser.companyId;
    }

    const token = jwt.sign(tobe,
      process.env.JWT_Key,
      { expiresIn: '18d' }
    )

    let send = {
      id: isUser._id,
      _id: isUser._id,
      name: isUser.name,
      email: isUser.email,
      role: isUser.role,
      sponsorCode: isUser.sponsorCode || isUser.customerId,
      mobile: isUser.mobile,
      isDeveloperSponsor: Boolean(isUser.isDeveloperSponsor || !isUser.sponsorId),
      branchIds: isUser.branchIds || [],
    };
    if (isUser.permissions) {
      send.permissions = isUser.permissions;
    }

    isUser.password = undefined;
    isUser.createdAt = undefined;

    // Record login audit log
    await logActivity({
      req,
      action: 'USER_LOGIN',
      module: 'AUTH',
      documentId: isUser._id,
      modelName: 'User',
      userId: isUser._id,
      userName: isUser.name,
      userRole: isUser.role,
      userEmail: isUser.email,
      description: `User ${isUser.name} (${isUser.role}) logged in successfully`,
      details: {
        userId: isUser._id,
        role: isUser.role,
        identifier: rawIdentifier,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'login successfull',
      token,
      user: send,
      // user: {
      //   name: isUser.name,
      //   email: isUser.email,
      //   role: isUser.role
      // }
    })
  } catch (error) {
    console.log(error.message)
    return next({ status: 500, message: error.message });
  }
}

const passreset = async (req, res, next) => {
  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes TTL
    const query = await user.findByIdAndUpdate(req.user.id, { 
      temptoken: hashedToken,
      temptokenExpiry: expiry 
    });
    if (!query) {
      return next({ status: 400, message: "UserId is Not Valid" });
    }
    const msg = `Hi <b>${query.name}</b>,
    <br>
    This mail is regards to your password reset request. 
    <br><br>
    <a href="https://office.battlefiesta.in/resetpassword/${rawToken}" style="display: inline-block; padding: 4px 20px; background-color: #007bff; color: #fff; text-decoration: none; letter-spacing: 1px;; border-radius: 5px;">Reset Password</a>
    `
    // await sendemail(req.user.email, 'Password Reset', msg);
    // await addJobToQueue(req.user.email, 'Password Reset || BattleFiesta', msg)
    await addtoqueue(req.user.email, 'Password Reset || BattleFiesta', msg)

    return res.status(200).json({
      message: 'Email sent',
      extramessage: `Email sent successfully to ${req.user.email}, Kindly check inbox or spam to proceed further. Thankyou`
    })
  } catch (error) {
    console.log(error);
    return next({ status: 500, message: error });
  }
}

const setpassword = async (req, res, next) => {
  const token = req.query.token;
  const password = req.body.password;

  if (!password || typeof password !== 'string' || password.trim().length < 6) {
    return next({ status: 400, message: 'Password must be at least 6 characters long' });
  }

  try {
    // Check for hashed token match (new flow) or plaintext match (legacy compatibility)
    const hashedIncoming = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    let query = await user.findOne({
      temptoken: hashedIncoming,
      $or: [
        { temptokenExpiry: { $gt: now } },
        { temptokenExpiry: null },
        { temptokenExpiry: { $exists: false } }
      ]
    });

    if (!query) {
      // Fallback check for legacy unhashed tokens that haven't expired
      query = await user.findOne({
        temptoken: token,
        $or: [
          { temptokenExpiry: { $gt: now } },
          { temptokenExpiry: null },
          { temptokenExpiry: { $exists: false } }
        ]
      });
    }

    if (!query) {
      return next({ status: 400, message: 'This reset link is invalid or has expired' });
    }

    const saltRound = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(password, saltRound);
    const passupdated = await user.updateOne({ _id: query._id }, { password: hash_password, temptoken: '', temptokenExpiry: null })

    if (!passupdated) {
      return next({ status: 400, message: 'something went wrong' });
    }
    return res.status(200).json({
      message: 'Password Updated'
    })
  } catch (error) {
    console.log(error);
    return next({ status: 500, message: error });
  }
}


const changeMyPassword = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userid;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters long' });
    }

    const targetUser = await user.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Verify current password if provided
    if (currentPassword && typeof currentPassword === 'string' && currentPassword.trim().length > 0) {
      const isMatch = await targetUser.checkpassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password does not match' });
      }
    }

    // Assign new password (pre-save hook in user model will hash it with bcrypt)
    targetUser.password = newPassword.trim();
    await targetUser.save();

    try {
      await logActivity({
        userId: targetUser._id,
        companyId: targetUser.companyId,
        action: 'UPDATE',
        resource: 'auth',
        description: `User ${targetUser.name} (${targetUser.role}) changed their account password directly from profile`,
        ipAddress: req.ip || req.connection?.remoteAddress
      });
    } catch (logErr) {
      console.warn('Audit log error (ignored):', logErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return next({ status: 500, message: error.message || 'Failed to change password' });
  }
};

module.exports = { userRegister, userLogin, passreset, setpassword, changeMyPassword };
