const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().allow('').max(5000).default(''),
  price: Joi.number().min(0).required(),
  oldPrice: Joi.number().min(0).optional(),
  category: Joi.string().trim().min(1).max(120).required(),
  stock: Joi.number().integer().min(0).required(),
  sku: Joi.string().trim().min(1).max(120).required(),
  status: Joi.string().valid('Active', 'Hidden').required(),
  image: Joi.string().trim().max(2048).allow('').optional(),
});

const productStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required(),
});

const productUpdateSchema = Joi.alternatives().try(
  productSchema,
  productStockSchema,
);

const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
});

const discountCreateSchema = Joi.object({
  code: Joi.string().trim().pattern(/^[A-Za-z0-9_-]+$/).min(2).max(32).required(),
  discount: Joi.number().min(0).max(100).required(),
  active: Joi.boolean().optional(),
});

const discountCheckSchema = Joi.object({
  code: Joi.string().trim().max(32).required(),
});

const loginSchema = Joi.object({
  password: Joi.string().min(8).max(128).required(),
});

const orderStatusSchema = Joi.object({
  status: Joi.string().valid('New', 'Paid', 'Shipped', 'Delivered', 'Cancelled').required(),
});

const bannerSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).required(),
  subtitle: Joi.string().trim().allow('').max(1000).required(),
  buttonText: Joi.string().trim().min(1).max(120).required(),
  buttonLink: Joi.string().trim().min(1).max(255).required(),
  active: Joi.boolean().required(),
});

const siteTextsSchema = Joi.object({
  aboutTitle: Joi.string().trim().min(1).max(255).required(),
  aboutText: Joi.string().trim().min(1).max(5000).required(),
  contactTitle: Joi.string().trim().min(1).max(255).required(),
  contactText: Joi.string().trim().min(1).max(5000).required(),
  faqTitle: Joi.string().trim().min(1).max(255).required(),
  faqText: Joi.string().trim().min(1).max(5000).required(),
  footerText: Joi.string().trim().min(1).max(500).required(),
});

const shippingMethodSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  price: Joi.number().min(0).required(),
  days: Joi.string().trim().min(1).max(120).required(),
  minOrder: Joi.number().min(0).optional(),
});

const socialLinkSchema = Joi.object({
  platform: Joi.string().trim().min(1).max(120).required(),
  url: Joi.string().uri().max(2000).required(),
});

const settingsSchema = Joi.object({
  currency: Joi.string().valid('USD', 'EUR', 'GBP').required(),
  currencySymbol: Joi.string().trim().max(3).required(),
  shippingMethods: Joi.array().items(shippingMethodSchema).required(),
  paymentMethods: Joi.array().items(Joi.string().trim().min(1).max(120)).required(),
  seoTitle: Joi.string().trim().min(1).max(255).required(),
  seoDescription: Joi.string().trim().min(1).max(2000).required(),
  seoKeywords: Joi.string().trim().min(1).max(500).required(),
  socialLinks: Joi.array().items(socialLinkSchema).required(),
});

const checkoutItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  price: Joi.number().min(0).required(),
  qty: Joi.number().integer().min(1).max(100).required(),
});

const checkoutSchema = Joi.object({
  items: Joi.array().items(checkoutItemSchema).min(1).required(),
  coupon: Joi.string().trim().max(32).allow('', null),
  customer: Joi.object({
    name: Joi.string().trim().max(255).allow('', null),
    address: Joi.string().trim().max(1000).allow('', null),
  }).optional(),
});

const checkoutVerifySchema = Joi.object({
  sessionId: Joi.string().trim().min(1).max(255).required(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    return next();
  };
}

module.exports = {
  validateBody,
  schemas: {
    bannerSchema,
    categorySchema,
    checkoutSchema,
    checkoutVerifySchema,
    discountCheckSchema,
    discountCreateSchema,
    loginSchema,
    orderStatusSchema,
    productSchema,
    productUpdateSchema,
    productStockSchema,
    settingsSchema,
    siteTextsSchema,
  },
};
