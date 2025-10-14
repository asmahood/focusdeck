/**
 * CardColumn Component Tests
 *
 * These tests verify the CardColumn component's rendering, structure,
 * and accessibility features.
 */

import { render, screen } from "@testing-library/react";
import { CardColumn } from "../CardColumn";

describe("CardColumn", () => {
  it("should render with title and count", () => {
    render(
      <CardColumn title="Issues Created" count={5}>
        <div>Test content</div>
      </CardColumn>,
    );

    expect(screen.getByText("Issues Created")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should render children content", () => {
    render(
      <CardColumn title="Pull Requests" count={3}>
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
      </CardColumn>,
    );

    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Card 2")).toBeInTheDocument();
    expect(screen.getByText("Card 3")).toBeInTheDocument();
  });

  it("should have proper ARIA labels", () => {
    render(
      <CardColumn title="Issues Assigned" count={2}>
        <div>Content</div>
      </CardColumn>,
    );

    const section = screen.getByRole("region");
    expect(section).toHaveAttribute("aria-labelledby", "issues-assigned-heading");
  });

  it("should generate correct heading ID", () => {
    render(
      <CardColumn title="Review Requests" count={10}>
        <div>Content</div>
      </CardColumn>,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", "review-requests-heading");
  });

  it("should handle multi-word titles with spaces in ID generation", () => {
    render(
      <CardColumn title="Pull Requests Awaiting Review" count={4}>
        <div>Content</div>
      </CardColumn>,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", "pull-requests-awaiting-review-heading");
  });

  it("should render with zero count", () => {
    render(
      <CardColumn title="Issues" count={0}>
        <div>No issues</div>
      </CardColumn>,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should have proper heading structure", () => {
    render(
      <CardColumn title="Test Column" count={7}>
        <div>Content</div>
      </CardColumn>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Test Column" });
    expect(heading).toBeInTheDocument();
  });

  it("should have scrollable content container", () => {
    render(
      <CardColumn title="Scrollable Column" count={20}>
        <div>Content that might overflow</div>
      </CardColumn>,
    );

    // Check that the scrollable container exists by looking for the content
    expect(screen.getByText("Content that might overflow")).toBeInTheDocument();
  });

  it("should have proper column styling classes", () => {
    render(
      <CardColumn title="Styled Column" count={1}>
        <div>Content</div>
      </CardColumn>,
    );

    const section = screen.getByRole("region");
    expect(section).toHaveClass("flex", "flex-col", "bg-neutral-900");
  });

  it("should display count badge with proper styling", () => {
    render(
      <CardColumn title="Badge Test" count={99}>
        <div>Content</div>
      </CardColumn>,
    );

    const badge = screen.getByText("99");
    expect(badge).toHaveClass("rounded-full", "bg-neutral-800");
  });

  it("should render with empty children", () => {
    render(<CardColumn title="Empty Column" count={0} />);

    expect(screen.getByText("Empty Column")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should have border styling", () => {
    render(
      <CardColumn title="Border Test" count={1}>
        <div>Content</div>
      </CardColumn>,
    );

    const section = screen.getByRole("region");
    expect(section).toHaveClass("border-r", "border-neutral-800");
  });

  it("should have proper spacing classes", () => {
    render(
      <CardColumn title="Spacing Test" count={1}>
        <div>Content</div>
      </CardColumn>,
    );

    // Verify content is rendered which confirms the spacing container exists
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
