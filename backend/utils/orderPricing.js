const mongoose = require("mongoose");
const Product = require("../models/Product");

const asPaise = (rupees) => Math.round(Number(rupees) * 100);

const configuredNumber = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeShippingAddress = (address) => {
  const fields = [
    "fullName",
    "address",
    "city",
    "state",
    "postalCode",
    "phone",
  ];
  if (!address || typeof address !== "object") {
    throw createError("Shipping address is required");
  }

  const normalized = Object.fromEntries(
    fields.map((field) => [field, String(address[field] || "").trim()]),
  );

  if (fields.some((field) => !normalized[field])) {
    throw createError("Please provide all shipping address fields");
  }

  return normalized;
};

const calculateOrderSnapshot = async (requestedItems, address, session) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    throw createError("Your cart is empty");
  }

  if (requestedItems.length > 50) {
    throw createError("Too many different products in one order");
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    const productId = String(item?.product || "");
    const quantity = Number(item?.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      throw createError("A cart item has an invalid product ID");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw createError(
        "Product quantities must be whole numbers between 1 and 100",
      );
    }

    const combinedQuantity = (quantities.get(productId) || 0) + quantity;
    if (combinedQuantity > 100) {
      throw createError("Maximum quantity per product is 100");
    }
    quantities.set(productId, combinedQuantity);
  }

  let productsQuery = Product.find({ _id: { $in: [...quantities.keys()] } });
  if (session) productsQuery = productsQuery.session(session);
  const products = await productsQuery;
  const productById = new Map(
    products.map((product) => [String(product._id), product]),
  );

  const orderItems = [];
  let itemsPaise = 0;

  for (const [productId, quantity] of quantities) {
    const product = productById.get(productId);
    if (!product) {
      throw createError("A product in your cart is no longer available", 404);
    }
    if (product.stock < quantity) {
      throw createError(`${product.name} does not have enough stock`, 409);
    }

    const pricePaise = asPaise(product.price);
    if (!Number.isSafeInteger(pricePaise) || pricePaise < 0) {
      throw createError(`Invalid price configured for ${product.name}`, 500);
    }

    itemsPaise += pricePaise * quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image || "",
      price: pricePaise / 100,
      quantity,
    });
  }

  if (!Number.isSafeInteger(itemsPaise)) {
    throw createError("Order amount is too large");
  }

  const freeShippingThresholdPaise = asPaise(
    configuredNumber("SHIPPING_FREE_THRESHOLD", 1000),
  );
  const shippingPaise =
    itemsPaise >= freeShippingThresholdPaise
      ? 0
      : asPaise(configuredNumber("SHIPPING_COST", 100));
  const taxRate = configuredNumber("TAX_RATE", 0.18);
  const taxPaise = Math.round(itemsPaise * taxRate);
  const totalPaise = itemsPaise + shippingPaise + taxPaise;
  if (!Number.isSafeInteger(totalPaise)) {
    throw createError("Order total is outside the supported amount range");
  }

  return {
    orderItems,
    shippingAddress: normalizeShippingAddress(address),
    itemsPrice: itemsPaise / 100,
    shippingPrice: shippingPaise / 100,
    taxPrice: taxPaise / 100,
    totalPrice: totalPaise / 100,
    totalAmount: totalPaise / 100,
    amountPaise: totalPaise,
  };
};

module.exports = {
  calculateOrderSnapshot,
  createError,
};
