import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profilePic: { type: String }, 
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
