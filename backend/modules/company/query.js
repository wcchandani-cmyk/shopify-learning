const COMPANIES_QUERY = `
  query Companies($first: Int!, $query: String) {
    companies(first: $first, query: $query) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const COMPANY_CREATE = `
  mutation CompanyCreate($input: CompanyCreateInput!) {
    companyCreate(input: $input) {
      company {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANY_ASSIGN_CONTACT = `
  mutation CompanyAssignCustomerAsContact($companyId: ID!, $customerId: ID!) {
    companyAssignCustomerAsContact(companyId: $companyId, customerId: $customerId) {
      companyContact {
        id
        company {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_COMPANY_QUERY = `
  query CustomerCompany($id: ID!) {
    customer(id: $id) {
      companyContactProfiles {
        id
        company {
          id
          name
        }
      }
    }
  }
`;

const COMPANY_CONTACT_REMOVE = `
  mutation CompanyContactRemoveFromCompany($companyContactId: ID!) {
    companyContactRemoveFromCompany(companyContactId: $companyContactId) {
      removedCompanyContactId
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANIES_QUERY_FULL = `
  query CompaniesFull($first: Int!) {
    companies(first: $first) {
      edges {
        node {
          id
          name
          totalSpent {
            amount
            currencyCode
          }
          locations(first: 10) {
            edges {
              node {
                id
              }
            }
          }
          contacts(first: 10) {
            edges {
              node {
                id
                isMainContact
                customer {
                  id
                  displayName
                }
              }
            }
          }
          orders(first: 10) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`;

const COMPANY_DETAIL_QUERY = `
  query CompanyDetail($id: ID!) {
    company(id: $id) {
      id
      name
      externalId
      createdAt
      mainContact {
        id
        customer {
          id
        }
      }
      totalSpent {
        amount
        currencyCode
      }
      locations(first: 20) {
        edges {
          node {
            id
            name
            staffMemberAssignments(first: 50) {
              edges {
                node {
                  id
                  staffMember {
                    id
                    name
                    email
                  }
                }
              }
            }
            shippingAddress {
              address1
              address2
              city
              province
              country
              zip
            }
            billingAddress {
              address1
              address2
              city
              province
              country
              zip
            }
            taxRegistrationId
            buyerExperienceConfiguration {
              checkoutToDraft
              editableShippingAddress
              paymentTermsTemplate {
                id
                name
              }
            }
            catalogs(first: 10) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        }
      }
      contacts(first: 50) {
        edges {
          node {
            id
            isMainContact
            customer {
              id
              displayName
              email
            }
            roleAssignments(first: 50) {
              edges {
                node {
                  id
                  role {
                    id
                    name
                  }
                  companyLocation {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
      contactRoles(first: 20) {
        nodes {
          id
          name
        }
      }
    }
  }
`;

const COMPANY_CONTACT_ASSIGN_ROLES = `
  mutation companyContactAssignRoles($companyContactId: ID!, $rolesToAssign: [CompanyContactRoleAssign!]!) {
    companyContactAssignRoles(companyContactId: $companyContactId, rolesToAssign: $rolesToAssign) {
      roleAssignments {
        id
        companyContact {
          id
        }
        role {
          id
          name
        }
        companyLocation {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANY_CONTACT_REVOKE_ROLES = `
  mutation companyContactRevokeRoles($companyContactId: ID!, $roleAssignmentIds: [ID!]!, $revokeAll: Boolean) {
    companyContactRevokeRoles(companyContactId: $companyContactId, roleAssignmentIds: $roleAssignmentIds, revokeAll: $revokeAll) {
      revokedRoleAssignmentIds
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANY_UPDATE = `
  mutation companyUpdate($companyId: ID!, $input: CompanyInput!) {
    companyUpdate(companyId: $companyId, input: $input) {
      company {
        id
        name
        externalId
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANY_ASSIGN_MAIN_CONTACT = `
  mutation companyAssignMainContact($companyId: ID!, $companyContactId: ID!) {
    companyAssignMainContact(companyId: $companyId, companyContactId: $companyContactId) {
      company {
        id
        mainContact {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANY_REVOKE_MAIN_CONTACT = `
  mutation companyRevokeMainContact($companyId: ID!) {
    companyRevokeMainContact(companyId: $companyId) {
      company {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMERS_FOR_COMPANY_QUERY = `
  query CustomersForCompany($first: Int!, $query: String) {
    customers(first: $first, query: $query) {
      edges {
        node {
          id
          displayName
          email
          companyContactProfiles {
            company {
              id
              name
            }
          }
        }
      }
    }
  }
`;

const STAFF_MEMBERS_QUERY = `
  query StaffMembers($first: Int!) {
    shop {
      staffMembers(first: $first) {
        edges {
          node {
            id
            name
            email
          }
        }
      }
    }
  }
`;

const COMPANY_LOCATION_ASSIGN_STAFF = `
  mutation companyLocationAssignStaffMembers($companyLocationId: ID!, $staffMemberIds: [ID!]!) {
    companyLocationAssignStaffMembers(companyLocationId: $companyLocationId, staffMemberIds: $staffMemberIds) {
      companyLocationStaffMemberAssignments {
        id
        staffMember {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANY_LOCATION_REMOVE_STAFF = `
  mutation companyLocationRemoveStaffMembers($companyLocationStaffMemberAssignmentIds: [ID!]!) {
    companyLocationRemoveStaffMembers(companyLocationStaffMemberAssignmentIds: $companyLocationStaffMemberAssignmentIds) {
      deletedCompanyLocationStaffMemberAssignmentIds
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_SEND_INVITE = `
  mutation customerSendAccountInviteEmail($customerId: ID!) {
    customerSendAccountInviteEmail(customerId: $customerId) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COMPANIES_DELETE = `
  mutation companiesDelete($companyIds: [ID!]!) {
    companiesDelete(companyIds: $companyIds) {
      deletedCompanyIds
      userErrors {
        field
        message
      }
    }
  }
`;

module.exports = {
  COMPANIES_QUERY,
  COMPANIES_QUERY_FULL,
  COMPANY_CREATE,
  COMPANY_ASSIGN_CONTACT,
  CUSTOMER_COMPANY_QUERY,
  COMPANY_CONTACT_REMOVE,
  COMPANY_DETAIL_QUERY,
  COMPANY_CONTACT_ASSIGN_ROLES,
  COMPANY_CONTACT_REVOKE_ROLES,
  COMPANY_UPDATE,
  COMPANY_ASSIGN_MAIN_CONTACT,
  COMPANY_REVOKE_MAIN_CONTACT,
  CUSTOMERS_FOR_COMPANY_QUERY,
  STAFF_MEMBERS_QUERY,
  COMPANY_LOCATION_ASSIGN_STAFF,
  COMPANY_LOCATION_REMOVE_STAFF,
  CUSTOMER_SEND_INVITE,
  COMPANIES_DELETE,
};

