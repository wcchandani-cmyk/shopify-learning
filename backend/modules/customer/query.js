const CUSTOMER_EVENTS_QUERY = `
  query CustomerEvents($id: ID!) {
    customer(id: $id) {
      events(first: 50) {
        nodes {
          id
          message
          createdAt
        }
      }
    }
  }
`;

module.exports = { CUSTOMER_EVENTS_QUERY };
