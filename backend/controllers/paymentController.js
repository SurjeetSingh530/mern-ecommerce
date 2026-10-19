const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const PaymentAttempt = require("../models/PaymentAttempt");
const Product = require("../models/Product");
const { getRazorpay } = require("../config/razorpay");
const { calculateOrderSnapshot } = require("../utils/orderPricing");

const safeSignatureMatch = (expected, received) => {
  if (typeof received !== "string" || !/^[a-f0-9]{64}$/i.test(received)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const checkoutSnapshotsMatch = (attempt, snapshot) => {
  const normalizeItems = (items) =>
    items
      .map((item) => ({
        product: String(item.product),
        name: item.name,
        image: item.image || "",
        price: item.price,
        quantity: item.quantity,
      }))
      .sort((left, right) => left.product.localeCompare(right.product));
  const addressFields = [
    "fullName",
    "address",
    "city",
    "state",
    "postalCode",
    "phone",
  ];
  const normalizeAddress = (address) =>
    Object.fromEntries(
      addressFields.map((field) => [field, String(address[field] || "")]),
    );

  return (
    attempt.totalAmount === snapshot.totalAmount &&
    JSON.stringify(normalizeItems(attempt.orderItems)) ===
      JSON.stringify(normalizeItems(snapshot.orderItems)) &&
    JSON.stringify(normalizeAddress(attempt.shippingAddress)) ===
      JSON.stringify(normalizeAddress(snapshot.shippingAddress))
  );
};

const paymentOrderResponse = (attempt, razorpayOrder, req) => ({
  paymentAttemptId: attempt._id,
  razorpayOrderId: attempt.razorpayOrderId,
  amount: razorpayOrder.amount,
  currency: razorpayOrder.currency,
  itemsPrice: attempt.itemsPrice,
  shippingPrice: attempt.shippingPrice,
  taxPrice: attempt.taxPrice,
  totalPrice: attempt.totalPrice,
  totalAmount: attempt.totalAmount,
  orderItems: attempt.orderItems.map((item) => ({
    product: String(item.product),
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
  })),
  keyId: process.env.RAZORPAY_KEY_ID,
  customer: {
    name: req.user.name,
    email: req.user.email,
    contact: req.user.phone || attempt.shippingAddress.phone,
  },
});

const finalizePaidOrder = async ({
  paymentAttemptId,
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  allowFailedOrder = false,
}) => {
  const session = await Order.startSession();
  let finalizedOrder;

  try {
    await session.withTransaction(async () => {
      const attempt = await PaymentAttempt.findOne({
        ...(paymentAttemptId ? { _id: paymentAttemptId } : {}),
        ...(userId ? { user: userId } : {}),
        razorpayOrderId,
      }).session(session);
      let order = await Order.findOne({
        razorpayOrderId,
        ...(userId ? { user: userId } : {}),
      }).session(session);
      if (!attempt && !order) {
        throw createError("Payment attempt or order not found", 404);
      }

      if (attempt?.paymentStatus === "Paid") {
        if (attempt.razorpayPaymentId === razorpayPaymentId && order) {
          finalizedOrder = order;
          return;
        }
        throw createError(
          "This payment attempt has already been processed",
          409,
        );
      }

      const paymentUsedElsewhere = await PaymentAttempt.findOne({
        razorpayPaymentId,
        ...(attempt ? { _id: { $ne: attempt._id } } : {}),
      })
        .session(session)
        .select("_id");
      const orderUsingPayment = await Order.findOne({
        razorpayPaymentId,
        ...(order ? { _id: { $ne: order._id } } : {}),
      })
        .session(session)
        .select("_id");
      if (paymentUsedElsewhere || orderUsingPayment) {
        throw createError(
          "This Razorpay payment has already been processed",
          409,
        );
      }

      if (
        (attempt &&
          attempt.paymentStatus !== "Pending" &&
          !(allowFailedOrder && attempt.paymentStatus === "Failed")) ||
        (order &&
          (order.paymentMethod !== "Razorpay" ||
            (order.paymentStatus !== "Pending" &&
              !(allowFailedOrder && order.paymentStatus === "Failed"))))
      ) {
        if (
          order?.paymentStatus === "Paid" &&
          order.razorpayPaymentId === razorpayPaymentId
        ) {
          finalizedOrder = order;
          return;
        }
        throw createError("This payment attempt is no longer pending", 409);
      }

      if (!order) {
        if (!attempt) throw createError("Payment order data is missing", 404);
        for (const item of attempt.orderItems) {
          const result = await Product.updateOne(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session },
          );
          if (result.modifiedCount !== 1) {
            throw createError(
              `${item.name} is no longer available in the requested quantity`,
              409,
            );
          }
        }
      }

      const paidAt = new Date();
      const verifiedSignature =
        razorpaySignature ||
        (process.env.RAZORPAY_KEY_SECRET
          ? crypto
              .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
              .update(`${razorpayOrderId}|${razorpayPaymentId}`)
              .digest("hex")
          : undefined);
      if (order) {
        order.paymentStatus = "Paid";
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = verifiedSignature;
        order.paidAt = paidAt;
        order.lastPaymentError = "";
        await order.save({ session });
      } else {
        const [createdOrder] = await Order.create(
          [
            {
              user: attempt.user,
              orderItems: attempt.orderItems,
              shippingAddress: attempt.shippingAddress,
              itemsPrice: attempt.itemsPrice,
              shippingPrice: attempt.shippingPrice,
              taxPrice: attempt.taxPrice,
              totalPrice: attempt.totalPrice,
              totalAmount: attempt.totalAmount,
              paymentMethod: "Razorpay",
              paymentStatus: "Paid",
              orderStatus: "Processing",
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature: verifiedSignature,
              paidAt,
            },
          ],
          { session },
        );
        order = createdOrder;
      }

      if (attempt) {
        attempt.paymentStatus = "Paid";
        attempt.razorpayPaymentId = razorpayPaymentId;
        attempt.razorpaySignature = verifiedSignature;
        attempt.order = order._id;
        attempt.paidAt = paidAt;
        attempt.lastPaymentError = "";
        await attempt.save({ session });
      }
      finalizedOrder = order;
    });

    return finalizedOrder;
  } finally {
    await session.endSession();
  }
};

const refundForUnavailableInventory = async (attempt, razorpayPaymentId) => {
  const claimedAttempt = await PaymentAttempt.findOneAndUpdate(
    { _id: attempt._id, paymentStatus: { $in: ["Pending", "Failed"] } },
    {
      $set: {
        paymentStatus: "Refund Pending",
        razorpayPaymentId,
        lastPaymentError: "Inventory became unavailable after payment",
      },
    },
    { new: true },
  );

  if (!claimedAttempt) return;

  try {
    const refund = await getRazorpay().payments.refund(razorpayPaymentId, {
      notes: {
        paymentAttemptId: String(attempt._id),
        reason: "Inventory unavailable",
      },
    });
    claimedAttempt.razorpayRefundId = refund.id;
    claimedAttempt.paymentStatus =
      refund.status === "processed" ? "Refunded" : "Refund Pending";
  } catch (error) {
    claimedAttempt.lastPaymentError = "Automatic refund could not be confirmed";
  }

  await claimedAttempt.save();
};

const createPaymentOrder = async (req, res) => {
  let pendingAttempt;
  let failureStage = "razorpay_configuration";

  try {
    const checkoutIntentId = req.body.checkoutIntentId;
    if (
      typeof checkoutIntentId !== "string" ||
      checkoutIntentId.trim().length < 1 ||
      checkoutIntentId.length > 100
    ) {
      throw createError("Checkout session is missing or invalid", 400);
    }

    const razorpay = getRazorpay();
    failureStage = "product_and_amount_validation";
    const snapshot = await calculateOrderSnapshot(
      req.body.orderItems,
      req.body.shippingAddress,
    );
    if (snapshot.amountPaise < 100) {
      throw createError("Razorpay orders must be at least ₹1", 400);
    }

    const existingAttempt = await PaymentAttempt.findOne({
      user: req.user._id,
      checkoutIntentId,
    });
    if (existingAttempt) {
      if (!checkoutSnapshotsMatch(existingAttempt, snapshot)) {
        throw createError(
          "Checkout details changed. Refresh checkout before retrying payment.",
          409,
        );
      }

      if (existingAttempt.paymentStatus === "Paid") {
        const existingOrder = await Order.findOne({
          razorpayOrderId: existingAttempt.razorpayOrderId,
          user: req.user._id,
        });
        if (!existingOrder) {
          throw createError(
            "Payment was recorded; refresh your orders to check its status.",
            409,
          );
        }
        return res.status(200).json({
          alreadyPaid: true,
          order: existingOrder,
        });
      }

      if (
        !["Pending", "Failed"].includes(existingAttempt.paymentStatus) ||
        !existingAttempt.razorpayOrderId
      ) {
        throw createError(
          "This checkout can no longer be retried. Start a new checkout.",
          409,
        );
      }

      const existingRazorpayOrder = await razorpay.orders.fetch(
        existingAttempt.razorpayOrderId,
      );
      if (
        existingRazorpayOrder.amount !== snapshot.amountPaise ||
        existingRazorpayOrder.currency !== "INR"
      ) {
        throw createError(
          "The saved Razorpay order does not match this checkout amount.",
          409,
        );
      }
      return res
        .status(200)
        .json(paymentOrderResponse(existingAttempt, existingRazorpayOrder, req));
    }

    pendingAttempt = await PaymentAttempt.create({
      user: req.user._id,
      checkoutIntentId,
      ...snapshot,
      paymentMethod: "Razorpay",
      paymentStatus: "Pending",
    });

    failureStage = "razorpay_order_creation";
    const razorpayOrder = await razorpay.orders.create({
      amount: snapshot.amountPaise,
      currency: "INR",
      receipt: String(pendingAttempt._id),
      notes: {
        shopcartPaymentAttemptId: String(pendingAttempt._id),
        userId: String(req.user._id),
      },
    });

    pendingAttempt.razorpayOrderId = razorpayOrder.id;
    failureStage = "save_razorpay_order_id";
    await pendingAttempt.save();

    return res
      .status(201)
      .json(paymentOrderResponse(pendingAttempt, razorpayOrder, req));
  } catch (error) {
    const razorpayAuthFailure = Number(error.statusCode) === 401;
    console.error("PAYMENT_ORDER_CREATION_FAILED", {
      stage: failureStage,
      statusCode: error.statusCode || null,
      errorName: error.name || "UnknownError",
      errorCode: error.code || error.error?.code || null,
    });
    if (pendingAttempt && !pendingAttempt.razorpayOrderId) {
      try {
        await PaymentAttempt.findByIdAndDelete(pendingAttempt._id);
      } catch (cleanupError) {
        console.error("PAYMENT_ATTEMPT_CLEANUP_FAILED", {
          errorName: cleanupError.name || "UnknownError",
          errorCode: cleanupError.code || null,
        });
      }
    }
    return res
      .status(razorpayAuthFailure ? 502 : error.statusCode || 502)
      .json({
        message: razorpayAuthFailure
          ? "Razorpay rejected the server credentials. Verify the Test Mode key pair."
          : error.statusCode
            ? error.message
            : "Unable to start Razorpay checkout. Please try again.",
        code: razorpayAuthFailure
          ? "RAZORPAY_API_AUTH_FAILED"
          : "PAYMENT_ORDER_CREATION_FAILED",
      });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      paymentAttemptId: requestedAttemptId,
      orderId: legacyAttemptId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;
    const paymentAttemptId = requestedAttemptId || legacyAttemptId;

    if (
      (paymentAttemptId && !mongoose.isValidObjectId(paymentAttemptId)) ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res
        .status(400)
        .json({ message: "Payment verification data is incomplete" });
    }

    const attempt = await PaymentAttempt.findOne({
      razorpayOrderId,
      user: req.user._id,
    });
    if (
      paymentAttemptId &&
      attempt &&
      String(attempt._id) !== paymentAttemptId
    ) {
      return res
        .status(409)
        .json({ message: "Payment attempt does not match the Razorpay order" });
    }

    const order = await Order.findOne({
      razorpayOrderId,
      user: req.user._id,
    });
    if (!attempt && !order) {
      return res.status(404).json({ message: "Payment order not found" });
    }
    if (
      paymentAttemptId &&
      !attempt &&
      order?.paymentStatus !== "Pending" &&
      order?.paymentStatus !== "Failed" &&
      !(
        order?.paymentStatus === "Paid" &&
        order.razorpayPaymentId === razorpayPaymentId
      )
    ) {
      return res
        .status(409)
        .json({ message: "Payment attempt is invalid or no longer pending" });
    }
    if (
      (attempt &&
        !["Pending", "Failed", "Paid"].includes(attempt.paymentStatus)) ||
      (order &&
        !["Pending", "Failed", "Paid"].includes(order.paymentStatus))
    ) {
      return res
        .status(409)
        .json({ message: "This payment is no longer payable" });
    }

    const razorpay = getRazorpay();
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeSignatureMatch(expectedSignature, razorpaySignature)) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    let payment = await razorpay.payments.fetch(razorpayPaymentId);
    const orderTotal =
      attempt?.totalAmount ?? order?.totalAmount ?? order?.totalPrice;
    const shopCartOrderTotal = order?.totalAmount ?? order?.totalPrice;
    const expectedAmount = Math.round(orderTotal * 100);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      (order &&
        Math.round(shopCartOrderTotal * 100) !== expectedAmount) ||
      payment.order_id !== razorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR"
    ) {
      return res
        .status(400)
        .json({ message: "Payment details do not match this order" });
    }

    if (payment.status === "authorized") {
      await razorpay.payments.capture(razorpayPaymentId, expectedAmount, "INR");
      payment = await razorpay.payments.fetch(razorpayPaymentId);
    }

    if (payment.status !== "captured") {
      return res
        .status(409)
        .json({ message: "Payment has not been captured yet" });
    }

    let paidOrder;
    try {
      paidOrder = await finalizePaidOrder({
        paymentAttemptId: attempt?._id,
        userId: req.user._id,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        allowFailedOrder: true,
      });
    } catch (error) {
      if (
        error.statusCode === 409 &&
        error.message.includes("no longer available")
      ) {
        if (attempt) {
          await refundForUnavailableInventory(attempt, razorpayPaymentId);
        }
        return res.status(409).json({
          message:
            "Payment succeeded, but stock changed. A refund has been started; please check your email or contact support.",
        });
      }
      throw error;
    }

    const savedOrder = await Order.findById(paidOrder._id)
      .populate("user", "name email")
      .populate("orderItems.product");

    return res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed",
      order: savedOrder,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This Razorpay payment has already been processed",
        code: "DUPLICATE_RAZORPAY_PAYMENT",
      });
    }
    console.error("PAYMENT_VERIFICATION_FAILED", {
      statusCode: error.statusCode || null,
      errorName: error.name || "UnknownError",
      errorCode: error.code || error.error?.code || null,
    });
    const razorpayAuthFailure = Number(error.statusCode) === 401;
    return res
      .status(razorpayAuthFailure ? 502 : error.statusCode || 502)
      .json({
        message: razorpayAuthFailure
          ? "Razorpay rejected the server credentials while verifying payment."
          : error.statusCode
            ? error.message
            : "Unable to verify payment right now. Your cart has not been cleared.",
        code: razorpayAuthFailure
          ? "RAZORPAY_API_AUTH_FAILED"
          : "PAYMENT_VERIFICATION_FAILED",
      });
  }
};

const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!webhookSecret || !Buffer.isBuffer(req.rawBody) || !signature) {
    return res
      .status(400)
      .json({ message: "Invalid webhook configuration or payload" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody)
    .digest("hex");

  if (!safeSignatureMatch(expectedSignature, signature)) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;

    if (
      event === "payment.captured" &&
      payment?.status === "captured" &&
      payment.order_id &&
      payment.id
    ) {
      const attempt = await PaymentAttempt.findOne({
        razorpayOrderId: payment.order_id,
      });
      const order = await Order.findOne({
        razorpayOrderId: payment.order_id,
      });
      const orderTotal =
        attempt?.totalAmount ?? order?.totalAmount ?? order?.totalPrice;
      const shopCartOrderTotal = order?.totalAmount ?? order?.totalPrice;

      if (!attempt && !order) {
        console.warn("RAZORPAY_CAPTURED_PAYMENT_NOT_MAPPED", {
          razorpayOrderId: payment.order_id,
        });
      } else if (
        !Number.isSafeInteger(Math.round(orderTotal * 100)) ||
        payment.amount !== Math.round(orderTotal * 100) ||
        (order &&
          Math.round(shopCartOrderTotal * 100) !==
            Math.round(orderTotal * 100)) ||
        payment.currency !== "INR"
      ) {
        console.error("RAZORPAY_WEBHOOK_AMOUNT_MISMATCH", {
          razorpayOrderId: payment.order_id,
          expectedAmount: Math.round(orderTotal * 100),
          receivedAmount: payment.amount,
          currency: payment.currency,
        });
        return res
          .status(400)
          .json({ message: "Webhook payment amount mismatch" });
      } else {
        try {
          await finalizePaidOrder({
            paymentAttemptId: attempt?._id,
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            allowFailedOrder: true,
          });
        } catch (error) {
          if (
            attempt &&
            error.statusCode === 409 &&
            error.message.includes("no longer available")
          ) {
            await refundForUnavailableInventory(attempt, payment.id);
          } else {
            throw error;
          }
        }
      }
    }

    if (event === "payment.failed" && payment?.order_id) {
      const failureMessage = String(
        payment.error_description || "Razorpay payment attempt failed",
      ).slice(0, 300);
      await PaymentAttempt.updateOne(
        { razorpayOrderId: payment.order_id, paymentStatus: "Pending" },
        {
          $set: {
            paymentStatus: "Failed",
            lastPaymentError: failureMessage,
          },
        },
      );
      await Order.updateOne(
        {
          razorpayOrderId: payment.order_id,
          paymentMethod: "Razorpay",
          paymentStatus: "Pending",
        },
        {
          $set: {
            paymentStatus: "Failed",
            lastPaymentError: failureMessage,
          },
        },
      );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("RAZORPAY_WEBHOOK_PROCESSING_FAILED", {
      event: req.body?.event || "unknown",
      errorName: error.name || "UnknownError",
      errorCode: error.code || null,
    });
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  razorpayWebhook,
};
