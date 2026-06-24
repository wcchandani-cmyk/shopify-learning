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

const SHOP_CURRENCIES_QUERY = `
  query ShopCurrencies {
    shop {
      currencyCode
      enabledPresentmentCurrencies
    }
  }
`;

module.exports = { SHOP_QUERY, SHOP_LOCALES_QUERY, SHOP_CURRENCIES_QUERY };
