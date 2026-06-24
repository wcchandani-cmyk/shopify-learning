const ORDER_CANCEL_MUTATION = `
  mutation OrderCancel(
    $orderId: ID!
    $reason: OrderCancelReason!
    $refundMethod: OrderCancelRefundMethodInput!
    $restock: Boolean!
    $notifyCustomer: Boolean
    $staffNote: String
  ) {
    orderCancel(
      orderId: $orderId
      reason: $reason
      refundMethod: $refundMethod
      restock: $restock
      notifyCustomer: $notifyCustomer
      staffNote: $staffNote
    ) {
      job {
        id
        done
      }
      orderCancelUserErrors {
        field
        message
        code
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_FULFILLMENT_ORDERS_QUERY = `
  query OrderFulfillmentOrders($id: ID!) {
    order(id: $id) {
      id
      fulfillmentOrders(first: 50) {
        nodes {
          id
          status
          requestStatus
          fulfillmentHolds {
            id
          }
        }
      }
    }
  }
`;

const FULFILLMENT_ORDER_RELEASE_HOLD_MUTATION = `
  mutation FulfillmentOrderReleaseHold($id: ID!, $holdIds: [ID!]) {
    fulfillmentOrderReleaseHold(id: $id, holdIds: $holdIds) {
      fulfillmentOrder {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FULFILLMENT_ORDER_CANCEL_MUTATION = `
  mutation FulfillmentOrderCancel($id: ID!) {
    fulfillmentOrderCancel(id: $id) {
      fulfillmentOrder {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const JOB_STATUS_QUERY = `
  query JobStatus($id: ID!) {
    job(id: $id) {
      id
      done
    }
  }
`;

const PAYMENT_TERMS_TEMPLATES_QUERY = `
  query PaymentTermsTemplates {
    paymentTermsTemplates {
      id
      name
      translatedName
      paymentTermsType
      dueInDays
    }
  }
`;

const DRAFT_ORDER_CREATE_MUTATION = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DRAFT_ORDER_COMPLETE_MUTATION = `
  mutation DraftOrderComplete($id: ID!, $paymentPending: Boolean) {
    draftOrderComplete(id: $id, paymentPending: $paymentPending) {
      draftOrder {
        id
        order {
          id
          legacyResourceId
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_MARK_AS_PAID_MUTATION = `
  mutation OrderMarkAsPaid($input: OrderMarkAsPaidInput!) {
    orderMarkAsPaid(input: $input) {
      order {
        id
        displayFinancialStatus
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FULFILLMENT_CREATE_MUTATION = `
  mutation FulfillmentCreate($fulfillment: FulfillmentInput!) {
    fulfillmentCreate(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FULFILLMENT_ORDER_HOLD_MUTATION = `
  mutation FulfillmentOrderHold($id: ID!, $reason: FulfillmentOrderHoldReason!, $reasonNotes: String) {
    fulfillmentOrderHold(id: $id, reason: $reason, reasonNotes: $reasonNotes) {
      fulfillmentOrder {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ORDER_EVENTS_QUERY = `
  query OrderEvents($id: ID!) {
    order(id: $id) {
      id
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

module.exports = {
  ORDER_CANCEL_MUTATION,
  ORDER_FULFILLMENT_ORDERS_QUERY,
  FULFILLMENT_ORDER_RELEASE_HOLD_MUTATION,
  FULFILLMENT_ORDER_CANCEL_MUTATION,
  JOB_STATUS_QUERY,
  PAYMENT_TERMS_TEMPLATES_QUERY,
  DRAFT_ORDER_CREATE_MUTATION,
  DRAFT_ORDER_COMPLETE_MUTATION,
  ORDER_MARK_AS_PAID_MUTATION,
  FULFILLMENT_CREATE_MUTATION,
  FULFILLMENT_ORDER_HOLD_MUTATION,
  ORDER_EVENTS_QUERY,
};


