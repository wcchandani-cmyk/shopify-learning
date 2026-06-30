import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ProductDetailPage from "../pages/products/ProductDetailPage";
import ProductVariantPage from "../pages/products/ProductVariantPage";
import ProductsPage from "../pages/products/ProductsPage";
import CustomersPage from "../pages/customers/CustomersPage";
import CompaniesPage from "../pages/companies/CompaniesPage";
import CompanyDetailPage from "../pages/companies/CompanyDetailPage";
import CustomerDetailPage from "../pages/customers/CustomerDetailPage";
import DiscountsPage from "../pages/discounts/DiscountsPage";
import DiscountCreatePage from "../pages/discounts/DiscountCreatePage";
import DiscountEditPage from "../pages/discounts/DiscountEditPage";
import CustomDiscountsPage from "../pages/discounts/CustomDiscountsPage";
import CustomDiscountCreatePage from "../pages/discounts/CustomDiscountCreatePage";
import CustomDiscountEditPage from "../pages/discounts/CustomDiscountEditPage";
import CheckoutUpsellsPage from "../pages/checkout/CheckoutUpsellsPage";
import CheckoutUpsellFormPage from "../pages/checkout/CheckoutUpsellFormPage";
import CheckoutCustomization from "../pages/checkout/CheckoutCustomization";
import CheckoutCustomField from "../pages/checkout/CheckoutCustomField";
import CheckoutCustomContent from "../pages/checkout/CheckoutCustomContent";
import CheckoutLineItemActions from "../pages/checkout/CheckoutLineItemActions";
import OrdersPage from "../pages/orders/OrdersPage";
import CreateOrderPage from "../pages/orders/CreateOrderPage";
import OrderDetailPage from "../pages/orders/OrderDetailPage";

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

  { path: "/checkout-customization", element: <CheckoutCustomization /> },
  { path: "/checkout-customization/custom-field/new", element: <CheckoutCustomField /> },
  { path: "/checkout-customization/custom-field/:id", element: <CheckoutCustomField /> },
  { path: "/checkout-customization/custom-content/new", element: <CheckoutCustomContent /> },
  { path: "/checkout-customization/custom-content/:id", element: <CheckoutCustomContent /> },
  { path: "/checkout-customization/line-item-actions/new", element: <CheckoutLineItemActions /> },
  { path: "/checkout-customization/line-item-actions/:id", element: <CheckoutLineItemActions /> },

  { path: "/checkout-upsells",      element: <CheckoutUpsellsPage /> },
  { path: "/checkout-upsells/new",  element: <CheckoutUpsellFormPage /> },
  { path: "/checkout-upsells/:id",  element: <CheckoutUpsellFormPage /> },

  { path: "/orders", element: <OrdersPage /> },
  { path: "/drafts", element: <OrdersPage /> },
  { path: "/orders/new", element: <CreateOrderPage /> },
  { path: "/drafts/new", element: <CreateOrderPage /> },
  { path: "/orders/:id", element: <OrderDetailPage /> },
  { path: "/drafts/:id", element: <OrderDetailPage /> },
]);
