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

const SHOP_LOCALES_QUERY = `
  query ShopLocales {
    shopLocales {
      locale
      primary
      published
    }
  }
`;

module.exports = { SHOP_QUERY, SHOP_LOCALES_QUERY };
