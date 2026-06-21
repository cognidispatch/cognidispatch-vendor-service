// vendor-service/serviceBusSubscriber.js
// Subscribes to the Azure Service Bus dispatch.created topic.
// When a message arrives (even if vendor was offline), fetches vendor
// details from DB and sends email notification via nodemailer.

const { ServiceBusClient } = require('@azure/service-bus');
const { sendDispatchNotification } = require('./emailNotifier');

/**
 * Starts the Service Bus subscriber. Called once on vendor-service boot.
 * The subscriber runs continuously in the background.
 */
async function startDispatchSubscriber() {
  const connectionString = process.env.SERVICEBUS_CONNECTION;
  const topicName        = process.env.SERVICEBUS_TOPIC        || 'dispatch-created';
  const subscriptionName = process.env.SERVICEBUS_SUBSCRIPTION || 'vendor-assignment';

  if (!connectionString) {
    console.warn('[ServiceBus Subscriber] SERVICEBUS_CONNECTION not set — subscriber disabled.');
    return;
  }

  const client   = new ServiceBusClient(connectionString);
  const receiver = client.createReceiver(topicName, subscriptionName, {
    receiveMode: 'peekLock'  // Message stays in queue until explicitly completed
  });

  receiver.subscribe({
    processMessage: async (message) => {
      const dispatch = message.body;
      console.log(`[ServiceBus Subscriber] 📨 Received dispatch.created for dispatch: ${dispatch.dispatchId}`);

      try {
        // Send email to vendor — vendorEmail was embedded in the message by dispatch-service
        if (dispatch.vendorEmail) {
          await sendDispatchNotification({
            vendorEmail: dispatch.vendorEmail,
            vendorName:  dispatch.vendorName || 'Technician',
            dispatch
          });
        } else {
          console.warn(`[ServiceBus Subscriber] No vendorEmail in message for dispatch ${dispatch.dispatchId}`);
        }

        // Mark message as successfully processed — removes from queue
        await receiver.completeMessage(message);
        console.log(`[ServiceBus Subscriber] ✅ Message completed for dispatch: ${dispatch.dispatchId}`);
      } catch (err) {
        console.error(`[ServiceBus Subscriber] ❌ Error processing dispatch ${dispatch.dispatchId}:`, err.message);
        // Abandon — message goes back to queue for retry (up to maxDeliveryCount=5)
        await receiver.abandonMessage(message);
      }
    },

    processError: async (err) => {
      console.error('[ServiceBus Subscriber] ❌ Receiver error:', err.message);
    }
  });

  console.log(`[ServiceBus Subscriber] ✅ Listening on topic "${topicName}" → subscription "${subscriptionName}"`);
}

module.exports = { startDispatchSubscriber };
