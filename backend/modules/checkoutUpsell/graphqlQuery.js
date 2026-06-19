const CHECKOUT_UPSELL_TYPE = "$app:checkout_upsell";

const CREATE_UPSELL_DEFINITION = `
  mutation CreateUpsellDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        type
        name
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const CREATE_UPSELL_METAOBJECT = `
  mutation CreateUpsellMetaobject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
        id
        handle
        fields {
          key
          value
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const UPDATE_UPSELL_METAOBJECT = `
  mutation UpdateUpsellMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
        handle
        fields {
          key
          value
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const DELETE_UPSELL_METAOBJECT = `
  mutation DeleteUpsellMetaobject($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const CREATE_AUTOMATIC_MUTATION = `
  mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
      automaticAppDiscount {
        discountId
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_AUTOMATIC_MUTATION = `
  mutation discountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!) {
    discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
      automaticAppDiscount {
        discountId
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DELETE_AUTOMATIC_MUTATION = `
  mutation discountAutomaticDelete($id: ID!) {
    discountAutomaticDelete(id: $id) {
      deletedAutomaticDiscountId
      userErrors {
        field
        code
        message
      }
    }
  }
`;

const ENABLE_MUTATION = `
  mutation discountAutomaticActivate($id: ID!) {
    discountAutomaticActivate(id: $id) {
      userErrors {
        field
        message
      }
    }
  }
`;

const DISABLE_MUTATION = `
  mutation discountAutomaticDeactivate($id: ID!) {
    discountAutomaticDeactivate(id: $id) {
      userErrors {
        field
        message
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_COLLECTION_PRODUCTS = `
  query GetCollectionProducts($id: ID!, $cursor: String) {
    collection(id: $id) {
      products(first: 250, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
        }
      }
    }
  }
`;

module.exports = {
  CHECKOUT_UPSELL_TYPE,
  CREATE_UPSELL_DEFINITION,
  CREATE_UPSELL_METAOBJECT,
  UPDATE_UPSELL_METAOBJECT,
  DELETE_UPSELL_METAOBJECT,
  CREATE_AUTOMATIC_MUTATION,
  UPDATE_AUTOMATIC_MUTATION,
  DELETE_AUTOMATIC_MUTATION,
  ENABLE_MUTATION,
  DISABLE_MUTATION,
  METAFIELDS_SET_MUTATION,
  GET_COLLECTION_PRODUCTS,
};
