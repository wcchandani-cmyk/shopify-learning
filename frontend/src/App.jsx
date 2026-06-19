import { RouterProvider } from "react-router-dom";
import { appRouter } from "./routes/router";
import { useShopBootstrap } from "./hooks/useShopBootstrap";
import "./App.css";
import "./styles/responsive.css";
import "./styles/ProductVariantEditor.css";

export default function App() {
  useShopBootstrap();

  return (
    <div className="app-shell">
      <ui-nav-menu>
        <a href="/" rel="home">
          Home
        </a>
        <a href="/products">Products</a>
        <a href="/customers">Customers</a>
        <a href="/companies">Companies</a>
        <a href="/discounts">Discounts</a>
        <a href="/custom-discounts">Custom Discount</a>
        <a href="/checkout-upsells">Checkout Upsell</a>
      </ui-nav-menu>
      <RouterProvider router={appRouter} />
    </div>
  );
}
