const SHOP_QUERY = `
  query {
    shop {
      name
      email
      currencyCode
      ianaTimezone
      weightUnit
      primaryDomain {
        host
      }
      plan {
        publicDisplayName
        shopifyPlus
      }
      billingAddress {
        city
        country
        province
      }
      shopOwnerName
      currencyFormats {
        moneyFormat
        moneyWithCurrencyFormat
      }
    }
  }
`;

module.exports = { SHOP_QUERY };
