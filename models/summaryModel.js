const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    points: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    
    
  },
  {
    timestamps: true,
  }
);

const Summary = mongoose.model("Summary", productSchema);
module.exports = Summary;
