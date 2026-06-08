import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("@shopify/app-bridge-react", () => ({
  useAppBridge: () => ({
    idToken: jest.fn().mockResolvedValue("test-token"),
    intents: { invoke: jest.fn() },
    toast: { show: jest.fn() },
  }),
}));

jest.mock("./hooks/useProducts", () => ({
  useProducts: () => ({
    products: [],
    pagination: null,
    loading: false,
    error: null,
    page: 1,
    reload: jest.fn(),
    goToPreviousPage: jest.fn(),
    goToNextPage: jest.fn(),
  }),
}));

test("renders add product action", () => {
  render(<App />);
  expect(screen.getAllByText("Add product").length).toBeGreaterThan(0);
});
