import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // normalizes "User@Example.com" and "user@example.com"
      trim: true, // to the same stored value, so lookups can't miss
    },
    // We store the HASH here, never the plaintext password. The field
    // is deliberately named passwordHash, not password, so nobody
    // reading this schema later mistakes it for something readable.
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
