"use strict";

const { from } = require("rxjs");
const { map, catchError, mergeMap } = require("rxjs/operators");
const { ConsoleLogger } = require("@nebulae/backend-node-tools").log;
const { brokerFactory } = require("@nebulae/backend-node-tools").broker;

const NOTIFICATION_TOPIC =
  process.env.PUBSUB_TOPIC_SHARK_ATTACK_REPORTED ||
  "neb-university-gobernante31";

class PubSubClient {
  constructor() {
    this.brokerType =
      process.env.NOTIFICATION_BROKER_TYPE ||
      process.env.EVENT_STORE_BROKER_TYPE ||
      process.env.BROKER_TYPE ||
      "MQTT";
    if (this.brokerType === "PUBSUB") {
      const { PubSub } = require("@google-cloud/pubsub");
      this.projectId = process.env.PUBSUB_PROJECT_ID || "nebulae-lab";
      this.pubsubClient = new PubSub({ projectId: this.projectId });
      this.topic = this.pubsubClient.topic(NOTIFICATION_TOPIC);
    } else {
      // Local dev stand-in: reuse the MQTT broker already running in docker-compose
      this.broker = brokerFactory();
      this.mqttTopic = NOTIFICATION_TOPIC;
    }
  }

  /**
   * Publishes a SharkAttackReported notification.
   * - On GKE (BROKER_TYPE=PUBSUB): publishes to the GCP Pub/Sub topic.
   * - On local dev (BROKER_TYPE=MQTT): publishes to the local Mosquitto topic.
   * @param {Object} message The message payload to publish
   * @returns {Observable<string>} Observable that resolves to the message ID / topic
   */
  publish$(message) {
    if (!message) {
      ConsoleLogger.i("PubSubClient.publish$: message is null/undefined");
      return from(Promise.resolve("no-message"));
    }

    if (this.brokerType === "PUBSUB") {
      const dataBuffer = Buffer.from(JSON.stringify(message));
      return from(this.topic.publish(dataBuffer)).pipe(
        map((messageId) => {
          ConsoleLogger.i(
            `PubSubClient: Published message ${messageId} to GCP topic ${NOTIFICATION_TOPIC}`,
          );
          return messageId;
        }),
        catchError((err) => {
          ConsoleLogger.e(`PubSubClient.publish$ (GCP) error: ${err.message}`);
          throw err;
        }),
      );
    }

    // MQTT stand-in for local dev
    return this.broker
      .send$(this.mqttTopic, "SharkAttackReported", message)
      .pipe(
        map((messageId) => {
          ConsoleLogger.i(
            `PubSubClient: Published message ${messageId} to MQTT topic ${this.mqttTopic}`,
          );
          return messageId;
        }),
        catchError((err) => {
          ConsoleLogger.e(`PubSubClient.publish$ (MQTT) error: ${err.message}`);
          throw err;
        }),
      );
  }
}

let instance;
module.exports = () => {
  if (!instance) {
    instance = new PubSubClient();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
