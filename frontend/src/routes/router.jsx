import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ProductDetailPage from "../pages/ProductDetailPage";
import ProductVariantPage from "../pages/ProductVariantPage";
import ProductsPage from "../pages/ProductsPage";

export const appRouter = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/products", element: <ProductsPage /> },
  { path: "/products/:id/variants/new", element: <ProductVariantPage /> },
  { path: "/products/:id", element: <ProductDetailPage /> },
]);
