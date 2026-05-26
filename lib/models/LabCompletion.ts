import { model, models, Schema } from "mongoose";

const schema = new Schema({
  userId:      { type: String, required: true },
  labId:       { type: String, required: true },
  completedAt: { type: Date, default: Date.now },
  durationMs:  { type: Number, default: 0 },
});

schema.index({ userId: 1, labId: 1 }, { unique: true });

export const LabCompletion = models.LabCompletion ?? model("LabCompletion", schema);
