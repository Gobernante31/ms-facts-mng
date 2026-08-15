"use strict";

const { iif, forkJoin, of } = require("rxjs");
const { tap, catchError } = require("rxjs/operators");
const { ConsoleLogger } = require("@nebulae/backend-node-tools").log;

const SharkAttackDA = require("./data-access/SharkAttackDA");
const PubSubClient = require("../../tools/pubsub/PubSubClient");
/**
 * Singleton instance
 * @type { SharkAttackES }
 */
let instance;

class SharkAttackES {
  constructor() {}

  /**
   * Generates and returns an object that defines the Event-Sourcing events handlers.
   *
   * The map is a relationship of: AGGREGATE_TYPE VS { EVENT_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
   *
   * ## Example
   *  { "User" : { "UserAdded" : {fn: handleUserAdded$, instance: classInstance } } }
   */
  generateEventProcessorMap() {
    return {
      SharkAttack: {
        SharkAttackModified: {
          fn: instance.handleSharkAttackModified$,
          instance,
          processOnlyOnSync: true,
        },
        SharkAttackReported: {
          fn: instance.handleSharkAttackReported$,
          instance,
        },
      },
    };
  }

  /**
   * Using the SharkAttackModified events restores the MaterializedView
   * This is just a recovery strategy
   * @param {*} SharkAttackModifiedEvent SharkAttack Modified Event
   */
  handleSharkAttackModified$({ etv, aid, av, data, user, timestamp }) {
    const aggregateDataMapper = [
      /*etv=0 mapper*/ () => {
        throw new Error("etv 0 is not an option");
      },
      /*etv=1 mapper*/ (eventData) => {
        return { ...eventData, modType: undefined };
      },
    ];
    delete aggregateDataMapper.modType;
    const aggregateData = aggregateDataMapper[etv](data);
    return iif(
      () => data.modType === "DELETE",
      SharkAttackDA.deleteSharkAttack$(aid),
      SharkAttackDA.updateSharkAttackFromRecovery$(aid, aggregateData, av),
    ).pipe(
      tap(() =>
        ConsoleLogger.i(
          `SharkAttackES.handleSharkAttackModified: ${data.modType}: aid=${aid}, timestamp=${timestamp}`,
        ),
      ),
    );
  }

  /**
   * Handles SharkAttackReported events from import.
   * Persists the record to MongoDB using upsert on _id (idempotent).
   * Publishes to Google Cloud Pub/Sub in parallel.
   * If Pub/Sub fails, event is not acknowledged (retry on re-delivery).
   * @param {*} event { etv, aid, av, data, user, timestamp }
   */
  handleSharkAttackReported$({ etv, aid, av, data, user, timestamp }) {
    const pubSubClient = PubSubClient();
    return forkJoin(
      SharkAttackDA.createSharkAttacks$([data], user),
      pubSubClient.publish$(data),
    ).pipe(
      tap(([mongoResult, pubSubMsgId]) => {
        ConsoleLogger.i(
          `SharkAttackES.handleSharkAttackReported: persisted aid=${aid}, ` +
            `mongoUpserted=${mongoResult.upserted}, mongoMatched=${mongoResult.matched}, ` +
            `pubSubMsgId=${pubSubMsgId}`,
        );
      }),
      catchError((err) => {
        ConsoleLogger.e(
          `SharkAttackES.handleSharkAttackReported error: ${err.message}`,
        );
        throw err; // Not acking -> event will be retried
      }),
    );
  }
}

/**
 * @returns {SharkAttackES}
 */
module.exports = () => {
  if (!instance) {
    instance = new SharkAttackES();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
