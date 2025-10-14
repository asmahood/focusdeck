/**
 * SignInForm Component Tests
 *
 * These tests verify the SignInForm component's UI and accessibility.
 * This is a presentational component that renders a form button with the provider info.
 *
 * Note: This component uses React 19's useFormStatus hook which requires a <form> parent
 * with a server action. In a real integration test, you'd test the full form flow
 * with MSW mocking the OAuth endpoints.
 */

import { render, screen } from "@testing-library/react";
import { SignInForm } from "../SignInForm";

describe("SignInForm", () => {
  const mockProvider = {
    id: "github",
    name: "GitHub",
  };

  it("should render with provider name", () => {
    render(<SignInForm provider={mockProvider} />);
    expect(screen.getByText("Sign in with GitHub")).toBeInTheDocument();
  });

  it("should have proper ARIA attributes", () => {
    render(<SignInForm provider={mockProvider} />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-label", "Sign in with GitHub");
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should have aria-busy attribute set to false initially", () => {
    render(<SignInForm provider={mockProvider} />);
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("should render GitHub icon SVG", () => {
    render(<SignInForm provider={mockProvider} />);
    const button = screen.getByRole("button");
    const svg = button.querySelector('svg[viewBox="0 0 16 16"]');

    expect(svg).toBeInTheDocument();
  });

  it("should have proper button classes for styling", () => {
    render(<SignInForm provider={mockProvider} />);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("group", "rounded-lg", "bg-green-600");
  });
});
