import { model, models, Schema } from "mongoose";

const answerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    chosen: { type: String, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false }
);

const schema = new Schema({
  userId:    { type: String, required: true, index: true },
  tier:      { type: String, required: true, enum: ["beginner", "intermediate", "advanced"] },
  score:     { type: Number, required: true },
  total:     { type: Number, required: true },
  answers:   { type: [answerSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ userId: 1, tier: 1 });

export const QuizAttempt = models.QuizAttempt ?? model("QuizAttempt", schema);
