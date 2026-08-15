"use strict";

let mongoDB = undefined;
const { map, mapTo, mergeMap, toArray } = require("rxjs/operators");
const { of, Observable, defer, forkJoin } = require("rxjs");

const { CustomError } = require("@nebulae/backend-node-tools").error;

const CollectionName = "SharkAttack";

class SharkAttackDA {
  static start$(mongoDbInstance) {
    return Observable.create((observer) => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next(`${this.name} using given mongo instance`);
      } else {
        mongoDB = require("../../../tools/mongo-db/MongoDB").singleton();
        observer.next(
          `${this.name} using singleton system-wide mongo instance`,
        );
      }
      observer.next(`${this.name} started`);
      observer.complete();
    });
  }

  /**
   * Gets an user by its username
   */
  static getSharkAttack$(id, organizationId) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id,
      organizationId,
    };
    return defer(() => collection.findOne(query)).pipe(
      map((res) => {
        return res !== null ? { ...res, id: res._id } : {};
      }),
    );
  }

  static generateListingQuery(filter) {
    const query = {};
    if (filter.name) {
      query["name"] = { $regex: filter.name, $options: "i" };
    }
    if (filter.organizationId) {
      query["organizationId"] = filter.organizationId;
    }
    if (filter.active !== undefined) {
      query["active"] = filter.active;
    }
    return query;
  }

  static getSharkAttackList$(filter = {}, pagination = {}, sortInput) {
    const collection = mongoDB.db.collection(CollectionName);
    const { page = 0, count = 10 } = pagination;

    const query = this.generateListingQuery(filter);
    const projection = { date: 1, country: 1, type: 1, species: 1 };

    let cursor = collection
      .find(query, { projection })
      .skip(count * page)
      .limit(count);

    const sort = {};
    if (sortInput) {
      sort[sortInput.field] = sortInput.asc ? 1 : -1;
    } else {
      sort["metadata.createdAt"] = -1;
    }
    cursor = cursor.sort(sort);

    return mongoDB
      .extractAllFromMongoCursor$(cursor)
      .pipe(map((res) => ({ ...res, id: res._id })));
  }

  static getSharkAttackSize$(filter = {}) {
    const collection = mongoDB.db.collection(CollectionName);
    const query = this.generateListingQuery(filter);
    return defer(() => collection.countDocuments(query));
  }

  /**
   * Returns dashboard statistics using the MongoDB Aggregation Framework.
   * - totalAttacks: total number of persisted SharkAttack documents
   * - attacksByCountry: top 5 countries by attack count
   * - attacksByYear: attack count grouped by year (chronological)
   * @returns {Observable<{totalAttacks:number, attacksByCountry:Array, attacksByYear:Array}>}
   */
  static getDashboardStats$() {
    const collection = mongoDB.db.collection(CollectionName);

    const total$ = defer(() => collection.countDocuments({}));

    const byCountry$ = mongoDB
      .extractAllFromMongoCursor$(
        collection.aggregate([
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, country: "$_id", count: 1 } },
        ]),
      )
      .pipe(toArray());

    const byYear$ = mongoDB
      .extractAllFromMongoCursor$(
        collection.aggregate([
          { $group: { _id: "$year", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, year: "$_id", count: 1 } },
        ]),
      )
      .pipe(toArray());

    return forkJoin(total$, byCountry$, byYear$).pipe(
      map(([totalAttacks, attacksByCountry, attacksByYear]) => ({
        totalAttacks,
        attacksByCountry,
        attacksByYear,
      })),
    );
  }

  /**
   * creates a new SharkAttack
   * @param {*} id SharkAttack ID
   * @param {*} SharkAttack properties
   */
  static createSharkAttack$(_id, properties, createdBy) {
    const metadata = {
      createdBy,
      createdAt: Date.now(),
      updatedBy: createdBy,
      updatedAt: Date.now(),
    };
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.insertOne({
        _id,
        ...properties,
        metadata,
      }),
    ).pipe(
      map(({ insertedId }) => ({ id: insertedId, ...properties, metadata })),
    );
  }

  /**
   * Bulk imports SharkAttack documents, matching on record id (_id) so a
   * re-import replaces existing records instead of duplicating them.
   * @param {Array<{_id: String, ...}>} sharkAttacks documents, each with an _id
   * @param {String} createdBy user that triggered the import
   */
  static createSharkAttacks$(sharkAttacks, createdBy) {
    if (!sharkAttacks || sharkAttacks.length === 0) {
      return of({ upserted: 0, matched: 0, modified: 0 });
    }
    const collection = mongoDB.db.collection(CollectionName);
    const ops = sharkAttacks.map(({ _id, ...properties }) => ({
      replaceOne: {
        filter: { _id },
        replacement: {
          _id,
          ...properties,
          metadata: {
            createdBy,
            createdAt: Date.now(),
            updatedBy: createdBy,
            updatedAt: Date.now(),
          },
        },
        upsert: true,
      },
    }));
    return defer(() => collection.bulkWrite(ops, { ordered: false })).pipe(
      map((res) => ({
        upserted: res.upsertedCount,
        matched: res.matchedCount,
        modified: res.modifiedCount,
      })),
    );
  }

  /**
   * modifies the SharkAttack properties
   * @param {String} id  SharkAttack ID
   * @param {*} SharkAttack properties to update
   */
  static updateSharkAttack$(_id, properties, updatedBy) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...properties,
            "metadata.updatedBy": updatedBy,
            "metadata.updatedAt": Date.now(),
          },
        },
        {
          returnOriginal: false,
        },
      ),
    ).pipe(
      map((result) =>
        result && result.value
          ? { ...result.value, id: result.value._id }
          : undefined,
      ),
    );
  }

  /**
   * modifies the SharkAttack properties
   * @param {String} id  SharkAttack ID
   * @param {*} SharkAttack properties to update
   */
  static updateSharkAttackFromRecovery$(_id, properties, av) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.updateOne(
        {
          _id,
        },
        { $set: { ...properties } },
        {
          returnOriginal: false,
          upsert: true,
        },
      ),
    ).pipe(
      map((result) =>
        result && result.value
          ? { ...result.value, id: result.value._id }
          : undefined,
      ),
    );
  }

  /**
   * modifies the SharkAttack properties
   * @param {String} id  SharkAttack ID
   * @param {*} SharkAttack properties to update
   */
  static replaceSharkAttack$(_id, properties) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.replaceOne({ _id }, properties)).pipe(
      mapTo({ id: _id, ...properties }),
    );
  }

  /**
   * deletes an SharkAttack
   * @param {*} _id  SharkAttack ID
   */
  static deleteSharkAttack$(_id) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.deleteOne({ _id }));
  }

  /**
   * deletes multiple SharkAttack at once
   * @param {*} _ids  SharkAttack IDs array
   */
  static deleteSharkAttacks$(_ids) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.deleteMany({ _id: { $in: _ids } })).pipe(
      map(({ deletedCount }) => deletedCount > 0),
    );
  }
}
/**
 * @returns {SharkAttackDA}
 */
module.exports = SharkAttackDA;
