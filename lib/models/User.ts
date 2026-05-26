import { model, models, Schema } from "mongoose";

const schema = new Schema({
  githubId:  { type: String, required: true, unique: true },
  name:      { type: String },
  email:     { type: String },
  avatar:    { type: String },
  firstSeen: { type: Date, default: Date.now },
  lastSeen:  { type: Date, default: Date.now },
});

export const User = models.User ?? model("User", schema);
