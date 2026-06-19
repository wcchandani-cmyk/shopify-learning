import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ProductVariantPage from "../pages/ProductVariantPage";
import ProductsPage from "../pages/ProductsPage";
import CustomersPage from "../pages/CustomersPage";
import CompaniesPage from "../pages/CompaniesPage";
import CompanyDetailPage from "../pages/CompanyDetailPage";
import CustomerDetailPage from "../pages/CustomerDetailPage";
import DiscountsPage from "../pages/DiscountsPage";
import DiscountCreatePage from "../pages/DiscountCreatePage";
import DiscountEditPage from "../pages/DiscountEditPage";
import CustomDiscountsPage from "../pages/CustomDiscountsPage";
import CustomDiscountCreatePage from "../pages/CustomDiscountCreatePage";
import CustomDiscountEditPage from "../pages/CustomDiscountEditPage";
import CheckoutUpsellsPage from "../pages/CheckoutUpsellsPage";
import CheckoutUpsellFormPage from "../pages/CheckoutUpsellFormPage";

export const appRouter = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/products", element: <ProductsPage /> },
  { path: "/products/:id/variants/new", element: <ProductVariantPage /> },
  { path: "/products/:id", element: <ProductDetailPage /> },
  { path: "/customers", element: <CustomersPage /> },
  { path: "/companies", element: <CompaniesPage /> },
  { path: "/companies/:id", element: <CompanyDetailPage /> },
  { path: "/customers/:id", element: <CustomerDetailPage /> },
  { path: "/discounts", element: <DiscountsPage /> },
  { path: "/discounts/new/:type", element: <DiscountCreatePage /> },
  { path: "/discounts/:id", element: <DiscountEditPage /> },
  { path: "/custom-discounts", element: <CustomDiscountsPage /> },
  { path: "/custom-discounts/new", element: <CustomDiscountCreatePage /> },
  { path: "/custom-discounts/:id", element: <CustomDiscountEditPage /> },
  // ── Checkout Upsell routes ────────────────────────────────────────────────────────
  { path: "/checkout-upsells",      element: <CheckoutUpsellsPage /> },
  { path: "/checkout-upsells/new",  element: <CheckoutUpsellFormPage /> },
  { path: "/checkout-upsells/:id",  element: <CheckoutUpsellFormPage /> },
]);
