/**
 * Dashboard Page Tests
 *
 * These tests verify the dashboard page layout, responsive behavior,
 * and proper rendering of all columns with mock data.
 */

import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";

describe("DashboardPage", () => {
  it("should render all four column headers", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Issues Created")).toBeInTheDocument();
    expect(screen.getByText("Issues Assigned")).toBeInTheDocument();
    expect(screen.getByText("Pull Requests")).toBeInTheDocument();
    expect(screen.getByText("Review Requests")).toBeInTheDocument();
  });

  it("should render column count badges", () => {
    render(<DashboardPage />);

    // Mock data has specific counts per column
    const badges = screen.getAllByText(/^\d+$/); // Match numeric text
    expect(badges.length).toBeGreaterThanOrEqual(4); // At least 4 count badges
  });

  it("should render cards with mock data", () => {
    render(<DashboardPage />);

    // Check for some sample card titles from mock data
    expect(screen.getByText("Add dark mode support to the dashboard")).toBeInTheDocument();
    expect(screen.getByText("Fix responsive layout issues on mobile devices")).toBeInTheDocument();
  });

  it("should have proper dashboard container structure", () => {
    const { container } = render(<DashboardPage />);

    // Check for main dashboard wrapper with proper classes
    const dashboardWrapper = container.querySelector(".h-screen");
    expect(dashboardWrapper).toBeInTheDocument();
    expect(dashboardWrapper).toHaveClass("overflow-hidden", "bg-neutral-950", "p-4");
  });

  it("should have grid layout container for desktop", () => {
    const { container } = render(<DashboardPage />);

    // Check for the grid container with responsive classes
    const gridContainer = container.querySelector(".lg\\:grid");
    expect(gridContainer).toBeInTheDocument();
  });

  it("should have proper height constraints", () => {
    const { container } = render(<DashboardPage />);

    // Check for calc(100vh-2rem) height on container
    const heightContainer = container.querySelector('[class*="h-\\[calc"]');
    expect(heightContainer).toBeInTheDocument();
  });

  it("should render all snap-item wrappers for mobile scrolling", () => {
    const { container } = render(<DashboardPage />);

    const snapItems = container.querySelectorAll(".snap-item");
    expect(snapItems).toHaveLength(4); // One for each column
  });

  it("should apply staggered animation delays to cards", () => {
    const { container } = render(<DashboardPage />);

    // Check that cards have animation-delay inline styles
    const animatedCards = container.querySelectorAll('[style*="animation-delay"]');
    expect(animatedCards.length).toBeGreaterThan(0);
  });

  it("should have gap spacing between columns", () => {
    const { container } = render(<DashboardPage />);

    const gridContainer = container.querySelector(".gap-3");
    expect(gridContainer).toBeInTheDocument();
  });

  it("should have rounded corners on dashboard container", () => {
    const { container } = render(<DashboardPage />);

    const roundedContainer = container.querySelector(".rounded-lg");
    expect(roundedContainer).toBeInTheDocument();
  });

  it("should render repository names in cards", () => {
    render(<DashboardPage />);

    // Check for repository format owner/name
    const repoText = screen.getAllByText(/focusdeck/i);
    expect(repoText.length).toBeGreaterThan(0);
  });

  it("should render issue and PR status badges", () => {
    render(<DashboardPage />);

    // Check for status badges
    expect(screen.getAllByText("open").length).toBeGreaterThan(0);
  });

  it("should render labels on cards", () => {
    render(<DashboardPage />);

    // Check for common label names from mock data - use getAllByText since labels appear multiple times
    const bugLabels = screen.getAllByText("bug");
    expect(bugLabels.length).toBeGreaterThan(0);

    const enhancementLabels = screen.getAllByText("enhancement");
    expect(enhancementLabels.length).toBeGreaterThan(0);
  });

  it("should have proper overflow handling", () => {
    const { container } = render(<DashboardPage />);

    // Desktop: no horizontal scroll on the main container
    const desktopContainer = container.querySelector(".lg\\:overflow-x-hidden");
    expect(desktopContainer).toBeInTheDocument();

    // Mobile/Tablet: horizontal scroll enabled
    const mobileContainer = container.querySelector(".overflow-x-auto");
    expect(mobileContainer).toBeInTheDocument();
  });

  it("should render all columns with proper ARIA labels", () => {
    render(<DashboardPage />);

    const regions = screen.getAllByRole("region");
    expect(regions).toHaveLength(4); // Four column sections
  });

  it("should display comment counts on cards", () => {
    const { container } = render(<DashboardPage />);

    // Mock data includes cards with comment counts
    // Look for comment icon SVGs
    const commentIcons = container.querySelectorAll('svg[viewBox="0 0 16 16"]');
    expect(commentIcons.length).toBeGreaterThan(0);
  });

  it("should render cards as clickable links", () => {
    render(<DashboardPage />);

    const cardLinks = screen.getAllByRole("link");
    expect(cardLinks.length).toBeGreaterThan(0);

    // All cards should link to GitHub
    cardLinks.forEach((link) => {
      expect(link).toHaveAttribute("href");
      expect(link.getAttribute("href")).toMatch(/github\.com/);
    });
  });

  it("should have proper responsive column widths", () => {
    const { container } = render(<DashboardPage />);

    // Check for min-width on mobile/tablet
    const columns = container.querySelectorAll(".min-w-\\[280px\\]");
    expect(columns.length).toBeGreaterThan(0);
  });

  it("should apply fadeIn animation class to cards", () => {
    const { container } = render(<DashboardPage />);

    const animatedCards = container.querySelectorAll(".animate-fadeIn");
    expect(animatedCards.length).toBeGreaterThan(0);
  });

  it("should render time indicators on cards", () => {
    render(<DashboardPage />);

    // Check for relative time text (e.g., "2 hours ago", "3 days ago")
    const timeIndicators = screen.getAllByText(/ago$/);
    expect(timeIndicators.length).toBeGreaterThan(0);
  });

  it("should have proper column header styling", () => {
    render(<DashboardPage />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(4);

    headings.forEach((heading) => {
      expect(heading).toHaveClass("text-sm", "font-semibold", "text-neutral-50");
    });
  });
});
