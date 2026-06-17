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

const CREATE_CODE_MUTATION = `
  mutation discountCodeAppCreate($codeAppDiscount: DiscountCodeAppInput!) {
    discountCodeAppCreate(codeAppDiscount: $codeAppDiscount) {
      codeAppDiscount {
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

const UPDATE_CODE_MUTATION = `
  mutation discountCodeAppUpdate($codeAppDiscount: DiscountCodeAppInput!, $id: ID!) {
    discountCodeAppUpdate(codeAppDiscount: $codeAppDiscount, id: $id) {
      codeAppDiscount {
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

const DELETE_CODE_MUTATION = `
  mutation discountCodeDelete($id: ID!) {
    discountCodeDelete(id: $id) {
      deletedCodeDiscountId
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

const ENABLE_CODE_MUTATION = `
  mutation discountCodeActivate($id: ID!) {
    discountCodeActivate(id: $id) {
      userErrors {
        field
        message
      }
    }
  }
`;

const DISABLE_CODE_MUTATION = `
  mutation discountCodeDeactivate($id: ID!) {
    discountCodeDeactivate(id: $id) {
      userErrors {
        field
        message
      }
    }
  }
`;

module.exports = {
  CREATE_AUTOMATIC_MUTATION,
  CREATE_CODE_MUTATION,
  UPDATE_AUTOMATIC_MUTATION,
  UPDATE_CODE_MUTATION,
  METAFIELDS_SET_MUTATION,
  DELETE_AUTOMATIC_MUTATION,
  DELETE_CODE_MUTATION,
  ENABLE_MUTATION,
  DISABLE_MUTATION,
  ENABLE_CODE_MUTATION,
  DISABLE_CODE_MUTATION,
};
