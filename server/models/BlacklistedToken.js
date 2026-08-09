const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const BlacklistedTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = model('BlacklistedToken', BlacklistedTokenSchema);
