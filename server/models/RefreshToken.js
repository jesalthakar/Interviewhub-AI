const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const RefreshTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = model('RefreshToken', RefreshTokenSchema);
