require("dotenv").config();

const express = require("express");
const cors = require("cors");
require("./models/associations");
const shopRoutes = require("./modules/shop/route");
const productRoutes = require("./modules/product/route");
const customerRoutes = require("./modules/customer/route");
const companyRoutes = require("./modules/company/route");
const discountRoutes = require("./modules/discount/route");
const webhookRoutes = require("./modules/webhook/route");
const { PORT, BACKEND_URI } = require("./config/constants");

const JSON_BODY_LIMIT = "10mb";

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use("/webhooks", webhookRoutes);

app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use("/api/shop", shopRoutes);
app.use("/api/product", productRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/discount", discountRoutes);

app.listen(PORT, () => {
  console.log(
    `Backend running at ${BACKEND_URI || `http://localhost:${PORT}`}`,
  );
  console.log(`JSON body limit: ${JSON_BODY_LIMIT}`);
  console.log("Product list: 10 per request (paginated API)");
});
