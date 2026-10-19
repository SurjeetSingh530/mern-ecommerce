const User = require("../models/User");

// GET WISHLIST
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json(user.wishlist);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ADD TO WISHLIST
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    user.wishlist.push(productId);

    await user.save();

    const updatedUser = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json(updatedUser.wishlist);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// REMOVE FROM WISHLIST
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      (id) => id && id.toString() !== productId,
    );

    await user.save();

    const updatedUser = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json(updatedUser.wishlist);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
