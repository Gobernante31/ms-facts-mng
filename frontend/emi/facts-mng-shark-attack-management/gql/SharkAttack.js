import { gql } from "apollo-boost";

const sharkAttackFields = `
    id,organizationId,date,year,type,country,area,location,activity,name,sex,age,injury,fatal_y_n,time,species,investigator_or_source,pdf,href_formula,href,case_number,case_number0,
    metadata{ createdBy, createdAt, updatedBy, updatedAt }
`;

const sharkAttackInputFields = `
    date,year,type,country,area,location,activity,name,sex,age,injury,fatal_y_n,time,species,investigator_or_source,pdf,href_formula,href,case_number,case_number0
`;

export const FactsMngSharkAttackListing = (variables) => ({
  query: gql`
    query FactsMngSharkAttackListing(
      $filterInput: FactsMngSharkAttackFilterInput
      $paginationInput: FactsMngSharkAttackPaginationInput
      $sortInput: FactsMngSharkAttackSortInput
    ) {
      FactsMngSharkAttackListing(
        filterInput: $filterInput
        paginationInput: $paginationInput
        sortInput: $sortInput
      ) {
        listing {
          id
          date
          country
          type
          species
        }
        queryTotalResultCount
      }
    }
  `,
  variables,
  fetchPolicy: "network-only",
});

export const FactsMngSharkAttack = (variables) => ({
  query: gql`
            query FactsMngSharkAttack($id: ID!, $organizationId: String!){
                FactsMngSharkAttack(id:$id, organizationId:$organizationId){
                    ${sharkAttackFields}
                }
            }`,
  variables,
  fetchPolicy: "network-only",
});

export const FactsMngCreateSharkAttack = (variables) => ({
  mutation: gql`
            mutation  FactsMngCreateSharkAttack($input: FactsMngSharkAttackInput!){
                FactsMngCreateSharkAttack(input: $input){
                    ${sharkAttackFields}
                }
            }`,
  variables,
});

export const FactsMngDeleteSharkAttack = (variables) => ({
  mutation: gql`
    mutation FactsMngSharkAttackListing($ids: [ID]!) {
      FactsMngDeleteSharkAttacks(ids: $ids) {
        code
        message
      }
    }
  `,
  variables,
});

export const FactsMngUpdateSharkAttack = (variables) => ({
  mutation: gql`
            ,mutation  FactsMngUpdateSharkAttack($id: ID!,$input: FactsMngSharkAttackInput!, $merge: Boolean!){
                FactsMngUpdateSharkAttack(id:$id, input: $input, merge:$merge ){
                    ${sharkAttackFields}
                }
            }`,
  variables,
});

export const FactsMngSharkAttackRelatedCases = (variables) => ({
  query: gql`
    query FactsMngSharkAttackRelatedCases($country: String!) {
      FactsMngSharkAttackRelatedCases(country: $country) {
        name
        date
        type
        country
        location
        activity
        injury
        href
      }
    }
  `,
  variables,
  fetchPolicy: "network-only",
});

export const FactsMngImportSharkAttacks = (variables) => ({
  mutation: gql`
    mutation FactsMngImportSharkAttacks(
      $input: FactsMngSharkAttackImportInput!
    ) {
      FactsMngImportSharkAttacks(input: $input) {
        code
        message
        count
      }
    }
  `,
  variables,
});

export const onFactsMngSharkAttackModified = (variables) => [
  gql`subscription onFactsMngSharkAttackModified($id:ID!){
            FactsMngSharkAttackModified(id:$id){
                ${sharkAttackFields}
            }
    }`,
  { variables },
];

export const FactsMngSharkAttackDashboardStats = (variables) => ({
  query: gql`
    query FactsMngSharkAttackDashboardStats {
      FactsMngSharkAttackDashboardStats {
        totalAttacks
        attacksByCountry {
          country
          count
        }
        attacksByYear {
          year
          count
        }
      }
    }
  `,
  variables,
  fetchPolicy: "network-only",
});
