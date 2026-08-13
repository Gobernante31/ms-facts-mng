import { defer, of } from "rxjs";
import { mergeMap, map, delay, catchError } from "rxjs/operators";

import graphqlService from "../../../../services/graphqlService";
import * as AppActions from "app/store/actions";
import {
  FactsMngSharkAttackListing,
  FactsMngDeleteSharkAttack,
  FactsMngImportSharkAttacks,
  FactsMngSharkAttackRelatedCases,
} from "../../gql/SharkAttack";

export const SET_SHARK_ATTACKS = "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS";
export const SET_SHARK_ATTACKS_PAGE =
  "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS PAGE";
export const SET_SHARK_ATTACKS_ROWS_PER_PAGE =
  "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS ROWS PER PAGE";
export const SET_SHARK_ATTACKS_ORDER =
  "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS ORDER";
export const SET_SHARK_ATTACKS_FILTERS_ORGANIZATION_ID =
  "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS FILTERS ORGANIZATION_ID";
export const SET_SHARK_ATTACKS_FILTERS_NAME =
  "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS FILTERS NAME";
export const SET_SHARK_ATTACKS_FILTERS_ACTIVE =
  "[SHARK_ATTACK_MNG] SET SHARK_ATTACKS FILTERS ACTIVE";
export const SET_RELATED_CASES = "[SHARK_ATTACK_MNG] SET RELATED CASES";
export const SET_RELATED_CASES_LOADING =
  "[SHARK_ATTACK_MNG] SET RELATED CASES LOADING";

/**
 * Common function to generate the arguments for the FactsMngSharkAttackListing query based on the user input
 * @param {Object} queryParams
 */
function getListingQueryArguments({
  filters: { name, organizationId, active },
  order,
  page,
  rowsPerPage,
}) {
  const args = {
    filterInput: { organizationId },
    paginationInput: {
      page: page,
      count: rowsPerPage,
      queryTotalResultCount: page === 0,
    },
    sortInput: order.id
      ? { field: order.id, asc: order.direction === "asc" }
      : undefined,
  };
  if (name.trim().length > 0) {
    args.filterInput.name = name;
  }
  if (active !== null) {
    args.filterInput.active = active;
  }
  return args;
}

/**
 * Queries the SharkAttack Listing based on selected filters, page and order
 * @param {{ filters, order, page, rowsPerPage }} queryParams
 */
export function getSharkAttacks({ filters, order, page, rowsPerPage }) {
  const args = getListingQueryArguments({ filters, order, page, rowsPerPage });
  return (dispatch) =>
    graphqlService.client
      .query(FactsMngSharkAttackListing(args))
      .then((result) => {
        return dispatch({
          type: SET_SHARK_ATTACKS,
          payload: result.data.FactsMngSharkAttackListing,
        });
      });
}

/**
 * Turns a GraphQL error into a plain string message, since the backend can
 * return `message` as an object ({code, name, msg}) and FuseMessage requires
 * a string child.
 * @param {*} error
 */
function safeErrorMessage(error) {
  const raw =
    error &&
    error.graphQLErrors &&
    error.graphQLErrors[0] &&
    error.graphQLErrors[0].message
      ? error.graphQLErrors[0].message
      : error && error.message;
  if (typeof raw === "string" && raw) return raw;
  if (raw && raw.msg) return String(raw.msg);

  if (raw && raw.name) {
    const msg = raw.msg ? `: ${String(raw.msg)}` : "";
    return `${raw.name}${msg}`;
  }
  try {
    return JSON.stringify(raw);
  } catch (e) {
    return "Import failed";
  }
}

/**
 * Runs the backend importSharkAttacks command and refreshs the listing,
 * so the imported records are shown immediately.
 * @param {String} organizationId
 */
export function importSharkAttacks(organizationId) {
  return (dispatch, getState) =>
    defer(() =>
      graphqlService.client.mutate(
        FactsMngImportSharkAttacks({ input: { organizationId } }),
      ),
    )
      .pipe(
        mergeMap((result) => {
          const { message, count } = result.data.FactsMngImportSharkAttacks;
          dispatch(
            AppActions.showMessage({
              message: `${message} (${count})`,
              variant: "success",
            }),
          );
          const { filters, order, page, rowsPerPage } =
            getState().SharkAttackManagement.sharkAttacks;
          return dispatch(
            getSharkAttacks({ filters, order, page, rowsPerPage }),
          );
        }),
        catchError((error) => {
          console.error("importSharkAttacks failed:", error);
          dispatch(
            AppActions.showMessage({
              message: safeErrorMessage(error),
              variant: "error",
            }),
          );
          return of(null);
        }),
      )
      .toPromise();
}

/**
 * Queries up to 5 related SharkAttack cases from the same country. The 1s
 * delay keeps the progress indicator visible, as required by the deliverable.
 * @param {String} country
 */
export function getRelatedSharkAttacks(country) {
  return (dispatch) => {
    dispatch({ type: SET_RELATED_CASES_LOADING, loading: true });
    return defer(() =>
      graphqlService.client.query(FactsMngSharkAttackRelatedCases({ country })),
    )
      .pipe(
        delay(1000),
        mergeMap((result) => {
          dispatch({
            type: SET_RELATED_CASES,
            payload: result.data.FactsMngSharkAttackRelatedCases,
          });
          dispatch({ type: SET_RELATED_CASES_LOADING, loading: false });
          return of(null);
        }),
        catchError(() => {
          dispatch({ type: SET_RELATED_CASES_LOADING, loading: false });
          return of(null);
        }),
      )
      .toPromise();
  };
}

/**
 * Executes the mutation to remove the selected rows
 * @param {*} selectedForRemovalIds
 * @param {*} param1
 */
export function removeSharkAttacks(
  selectedForRemovalIds,
  { filters, order, page, rowsPerPage },
) {
  const deleteArgs = { ids: selectedForRemovalIds };
  const listingArgs = getListingQueryArguments({
    filters,
    order,
    page,
    rowsPerPage,
  });
  return (dispatch) =>
    defer(() =>
      graphqlService.client.mutate(FactsMngDeleteSharkAttack(deleteArgs)),
    )
      .pipe(
        mergeMap(() =>
          defer(() =>
            graphqlService.client.query(
              FactsMngSharkAttackListing(listingArgs),
            ),
          ),
        ),
        map((result) =>
          dispatch({
            type: SET_SHARK_ATTACKS,
            payload: result.data.FactsMngSharkAttackListing,
          }),
        ),
      )
      .toPromise();
}

/**
 * Set the listing page
 * @param {int} page
 */
export function setSharkAttacksPage(page) {
  return {
    type: SET_SHARK_ATTACKS_PAGE,
    page,
  };
}

/**
 * Set the number of rows to see per page
 * @param {*} rowsPerPage
 */
export function setSharkAttacksRowsPerPage(rowsPerPage) {
  return {
    type: SET_SHARK_ATTACKS_ROWS_PER_PAGE,
    rowsPerPage,
  };
}

/**
 * Set the table-column order
 * @param {*} order
 */
export function setSharkAttacksOrder(order) {
  return {
    type: SET_SHARK_ATTACKS_ORDER,
    order,
  };
}

/**
 * Set the name filter
 * @param {string} name
 */
export function setSharkAttacksFilterName(name) {
  return {
    type: SET_SHARK_ATTACKS_FILTERS_NAME,
    name,
  };
}

/**
 * Set the filter active flag on/off/both
 * @param {boolean} active
 */
export function setSharkAttacksFilterActive(active) {
  return {
    type: SET_SHARK_ATTACKS_FILTERS_ACTIVE,
    active,
  };
}

/**
 * set the organizationId filter
 * @param {string} organizationId
 */
export function setSharkAttacksFilterOrganizationId(organizationId) {
  return {
    type: SET_SHARK_ATTACKS_FILTERS_ORGANIZATION_ID,
    organizationId,
  };
}
