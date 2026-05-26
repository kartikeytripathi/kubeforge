import { model, models, Schema } from "mongoose";

const schema = new Schema({
  userId:    { type: String, required: true, index: true },
  labId:     { type: String, required: true },
  yaml:      { type: String, default: "" },
  passed:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ userId: 1, labId: 1 });

export const LabAttempt = models.LabAttempt ?? model("LabAttempt", schema);
