const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    deleteAllUsers,
    withdrawPoints,
    payUsers,
    editUser,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    updatePoints,
    getSpinCount,
    getAllUsers,
    getReferredUsers // Add this to your imports
  } = require("../controllers/userController");
  
const protect = require("../middleware/authMiddleware");
const adminProtect = require("../middleware/adminMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post('/update-points', updatePoints);
router.get("/logout", logout);
router.get("/getuser", protect, getUser);
router.get("/getalluser", getAllUsers);
router.get("/loggedin", loginStatus);
router.get('/spin-count/:userId', getSpinCount);
router.patch("/updateuser", protect, updateUser);
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
router.delete('/delete-all', deleteAllUsers);
router.post('/withdraw', protect, withdrawPoints);
router.put("/edit", protect, editUser);
router.post('/pay', protect, adminProtect, payUsers);
router.get('/referred-users', protect, getReferredUsers); // Add this route

module.exports = router;
