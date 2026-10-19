const Product = require("../models/Product");

// ===============================
// GET ALL PRODUCTS
// ===============================

const getProducts = async (req, res) => {
  try {
    const { search = "", category, sort, page = 1, limit = 8 } = req.query;

    const query = {};

    // Search
    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          brand: {
            $regex: search,
            $options: "i",
          },
        },
        {
          category: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Category
    if (category && category !== "All") {
      query.category = category;
    }

    const currentPage = Number(page);
    const productsLimit = Number(limit);

    const skip = (currentPage - 1) * productsLimit;

    // Sorting
    let sortOption = {
      createdAt: -1,
    };

    if (sort === "price-low") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "price-high") {
      sortOption = {
        price: -1,
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(productsLimit);

    const totalPages = Math.ceil(totalProducts / productsLimit);

    res.status(200).json({
      products,
      currentPage,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// GET SINGLE PRODUCT
// ===============================

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// CREATE PRODUCT
// ===============================

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, stock } = req.body;

    // Image required
    if (!req.file) {
      return res.status(400).json({
        message: "Product image is required",
      });
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      brand,
      stock: Number(stock),

      // Cloudinary URL
      image: req.file.path,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// UPDATE PRODUCT
// ===============================

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const { name, description, price, category, brand, stock } = req.body;

    // Update text/data fields
    product.name = name !== undefined ? name : product.name;

    product.description =
      description !== undefined ? description : product.description;

    product.price = price !== undefined ? Number(price) : product.price;

    product.category = category !== undefined ? category : product.category;

    product.brand = brand !== undefined ? brand : product.brand;

    product.stock = stock !== undefined ? Number(stock) : product.stock;

    // If new image uploaded
    if (req.file) {
      product.image = req.file.path;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// DELETE PRODUCT
// ===============================

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
