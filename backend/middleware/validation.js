const Joi = require('joi');

// Validation middleware factory
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message
      });
    }
    req.body = value; // Use sanitized values
    next();
  };
};

// User validation schemas
const userRegistrationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),
  email: Joi.string().email().required().lowercase(),  password: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*?&)'
    })
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().lowercase(),
  password: Joi.string().required()
});

const userUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),
  email: Joi.string().email().lowercase()
});

const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*?&)'
    })
});

// Role validation schema
const roleUpdateSchema = Joi.object({
  role: Joi.string().valid('user', 'admin').required()
});

// Website URL validation schema
const websiteUrlSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(500).allow(''),
  isActive: Joi.boolean()
});

// QR Code generation validation schema
const qrCodeGenerationSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(), // MongoDB ObjectId
  categoryId: Joi.string().hex().length(24).required(),
  websiteURL: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  websiteTitle: Joi.string().trim().min(1).max(200).required()
});

// Category validation schema
const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .messages({
      'string.pattern.base': 'Category name can only contain letters, numbers, spaces, hyphens, and underscores'
    }),
  description: Joi.string().trim().max(500).allow('')
});

// System settings validation schema
const systemSettingsSchema = Joi.object({
  securitySettings: Joi.object({
    maxLoginAttempts: Joi.number().integer().min(1).max(10),
    lockoutDuration: Joi.number().integer().min(60).max(86400), // 1 minute to 1 day
    sessionTimeout: Joi.number().integer().min(300).max(86400), // 5 minutes to 1 day
    passwordMinLength: Joi.number().integer().min(8).max(128),
    requireSpecialChars: Joi.boolean(),
    twoFactorAuth: Joi.boolean()
  }).unknown(true)
});

// Export validation middleware functions
module.exports = {
  validateBody,
  // User validations
  validateUserRegistration: validateBody(userRegistrationSchema),
  validateUserLogin: validateBody(userLoginSchema),
  validateUserUpdate: validateBody(userUpdateSchema),
  validatePasswordChange: validateBody(passwordChangeSchema),
  validateRoleUpdate: validateBody(roleUpdateSchema),
  // Content validations
  validateWebsiteUrl: validateBody(websiteUrlSchema),
  validateQrCodeGeneration: validateBody(qrCodeGenerationSchema),
  validateCategory: validateBody(categorySchema),
  validateSystemSettings: validateBody(systemSettingsSchema)
};
