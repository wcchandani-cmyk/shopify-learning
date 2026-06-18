require("dotenv").config();
require("./models/associations");
const Shop = require("./modules/shop/model");
const { getMetafieldTypes } = require("./modules/metafields/controller");

async function run() {
  try {
    const shop = await Shop.findOne({ where: { appInstall: "1" } });
    if (!shop) {
      console.log("No installed shop found in the database.");
      return;
    }
    console.log("Found shop:", shop.myshopifyDomain);

    const req = {
      shopDomain: shop.myshopifyDomain,
      sessionToken: null // resolveShopForApi fallback should use offline token from db
    };

    const res = {
      status: function(code) {
        console.log("Response Status:", code);
        return this;
      },
      json: function(data) {
        console.log("Response JSON:", JSON.stringify(data, null, 2));
        return this;
      }
    };

    await getMetafieldTypes(req, res);
  } catch (err) {
    console.error("Error running scratch test:", err);
  }
}

run();
