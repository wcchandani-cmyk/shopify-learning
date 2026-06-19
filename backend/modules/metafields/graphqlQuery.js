const DEFINITION_CREATE = `
  mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const DEFINITION_UPDATE = `
  mutation metafieldDefinitionUpdate($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const DEFINITION_DELETE = `
  mutation metafieldDefinitionDelete($id: ID!, $deleteAllAssociatedMetafields: Boolean!) {
    metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields) {
      deletedDefinitionId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const DEFINITION_LOOKUP = `
  query metafieldDefinitionLookup($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
    metafieldDefinitions(ownerType: $ownerType, namespace: $namespace, key: $key, first: 1) {
      nodes {
        id
      }
    }
  }
`;

const METAFIELDS_SET = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const METAFIELDS_DELETE = `
  mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields {
        ownerId
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const METAFEILD_TYPE = `
    query {
      metafieldDefinitionTypes {
        name
        category
        supportedValidations {
          name
          type
        }
      }
    }
  `;

module.exports = {
  DEFINITION_CREATE,
  DEFINITION_UPDATE,
  DEFINITION_DELETE,
  DEFINITION_LOOKUP,
  METAFIELDS_SET,
  METAFIELDS_DELETE,
  METAFEILD_TYPE,
};
