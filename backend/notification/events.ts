import { Topic } from "encore.dev/pubsub";

export interface TransactionNotification {
  transactionId: string;
  userId: string;
  productName: string;
  amount: number;
  status: string;
  timestamp: Date;
}

export interface MessageNotification {
  messageId: string;
  name: string;
  email: string;
  subject: string;
  timestamp: Date;
}

export const transactionTopic = new Topic<TransactionNotification>(
  "transaction-notifications",
  { deliveryGuarantee: "at-least-once" }
);

export const messageTopic = new Topic<MessageNotification>(
  "message-notifications",
  { deliveryGuarantee: "at-least-once" }
);
