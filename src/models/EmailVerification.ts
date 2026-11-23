import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailVerification extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index: Automatically remove document when current time >= expiresAt
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationModel: Model<IEmailVerification> =
  (mongoose.models.EmailVerification as Model<IEmailVerification>) ||
  mongoose.model<IEmailVerification>('EmailVerification', EmailVerificationSchema);
