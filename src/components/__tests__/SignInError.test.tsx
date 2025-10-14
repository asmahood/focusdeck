/**
 * SignInError Component Tests
 *
 * These tests verify the SignInError component's UI behavior and accessibility.
 * Since this is a presentational component with no API calls, we don't need MSW.
 *
 * Use MSW when testing components that:
 * - Make HTTP/GraphQL requests
 * - Use data fetching hooks
 * - Interact with external APIs
 *
 * For presentational components like this, simple unit tests are sufficient.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { SignInError } from "../SignInError";

describe("SignInError", () => {
  it("should not render when error is null or undefined", () => {
    const { container } = render(<SignInError error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render with known error type", () => {
    render(<SignInError error="AccessDenied" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Authentication Error")).toBeInTheDocument();
    expect(screen.getByText("Access was denied. Please try again.")).toBeInTheDocument();
  });

  it("should render with unknown error type showing default message", () => {
    render(<SignInError error="UnknownError" />);
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button is clicked", () => {
    const onDismiss = jest.fn();
    render(<SignInError error="AccessDenied" onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should not render dismiss button when onDismiss is not provided", () => {
    render(<SignInError error="AccessDenied" />);
    expect(screen.queryByLabelText("Dismiss error")).not.toBeInTheDocument();
  });

  it("should have proper ARIA attributes", () => {
    render(<SignInError error="AccessDenied" />);
    const alert = screen.getByRole("alert");

    expect(alert).toHaveAttribute("aria-live", "assertive");
  });
});
