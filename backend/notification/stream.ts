import { api, StreamOut } from "encore.dev/api";
import { Subscription } from "encore.dev/pubsub";
import { transactionTopic, messageTopic, TransactionNotification, MessageNotification } from "./events";

export interface NotificationMessage {
  type: "transaction" | "message";
  data: TransactionNotification | MessageNotification;
}

const connectedStreams: Set<StreamOut<NotificationMessage>> = new Set();

new Subscription(transactionTopic, "broadcast-transaction", {
  handler: async (event) => {
    const notification: NotificationMessage = {
      type: "transaction",
      data: event,
    };
    await broadcastNotification(notification);
  },
});

new Subscription(messageTopic, "broadcast-message", {
  handler: async (event) => {
    const notification: NotificationMessage = {
      type: "message",
      data: event,
    };
    await broadcastNotification(notification);
  },
});

async function broadcastNotification(notification: NotificationMessage) {
  const streamsToRemove: StreamOut<NotificationMessage>[] = [];
  
  for (const stream of connectedStreams) {
    try {
      await stream.send(notification);
    } catch (err) {
      streamsToRemove.push(stream);
    }
  }
  
  for (const stream of streamsToRemove) {
    connectedStreams.delete(stream);
  }
}

export const notifications = api.streamOut<NotificationMessage>(
  { path: "/notifications/stream", expose: true, auth: true },
  async (stream) => {
    connectedStreams.add(stream);

    await stream.send({
      type: "transaction",
      data: {
        transactionId: "connected",
        userId: "",
        productName: "Connected to notification stream",
        amount: 0,
        status: "info",
        timestamp: new Date(),
      },
    });

    try {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!connectedStreams.has(stream)) {
            clearInterval(checkInterval);
            resolve(null);
          }
        }, 1000);
      });
    } finally {
      connectedStreams.delete(stream);
    }
  }
);
