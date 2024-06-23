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
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    updatePoints,
    getSpinCount,
    getAllUsers
  } = require("../controllers/userController");
  const protect= require("../middleware/authMiddleware");
  const adminProtect= require("../middleware/adminMiddleware");

  
  router.post("/register", registerUser);
  router.post("/login", loginUser);
  router.post('/update-points',updatePoints)
  router.get("/logout", logout);
  
  router.get("/getuser", protect, getUser);   
  router.get("/getalluser", getAllUsers);  
  router.get("/loggedin", loginStatus);
  // Define the new route
router.get('/spin-count/:userId', getSpinCount);
  router.patch("/updateuser", protect, updateUser);
  router.patch("/changepassword", protect, changePassword);    
  router.post("/forgotpassword", forgotPassword);
  router.put("/resetpassword/:resetToken", resetPassword);
  router.delete('/delete-all',deleteAllUsers)

  router.post('/withdraw',protect, withdrawPoints);
router.post('/pay', protect, adminProtect, payUsers); 
  
  module.exports = router; 