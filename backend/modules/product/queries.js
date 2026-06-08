const PRODUCT_SET_MUTATION = `
  mutation ProductSet($input: ProductSetInput!, $synchronous: Boolean!) {
    productSet(input: $input, synchronous: $synchronous) {
      product {
        id
        category {
          id
          fullName
        }
      }
      userErrors { field message }
    }
  }
`;

const TAXONOMY_SEARCH_QUERY = `
  query TaxonomySearch($search: String, $childrenOf: ID, $first: Int!) {
    taxonomy {
      categories(search: $search, childrenOf: $childrenOf, first: $first) {
        nodes {
          id
          name
          fullName
          isLeaf
          isRoot
        }
      }
    }
  }
`;

const PRODUCT_TYPES_QUERY = `
  query ProductTypes($first: Int!, $after: String) {
    productTypes(first: $first, after: $after) {
      nodes
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCT_VENDORS_QUERY = `
  query ProductVendors($first: Int!, $after: String) {
    productVendors(first: $first, after: $after) {
      nodes
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

module.exports = {
  PRODUCT_SET_MUTATION,
  TAXONOMY_SEARCH_QUERY,
  PRODUCT_TYPES_QUERY,
  PRODUCT_VENDORS_QUERY,
};
