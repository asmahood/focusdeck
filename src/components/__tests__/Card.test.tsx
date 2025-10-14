/**
 * Card Component Tests
 *
 * These tests verify the Card component's rendering, accessibility,
 * and proper display of issue/PR information.
 */

import { render, screen } from "@testing-library/react";
import { Card } from "../Card";
import { CardData } from "@/types/card";

describe("Card", () => {
  const mockCardData: CardData = {
    id: "1",
    type: "issue",
    number: 123,
    title: "Fix authentication bug in sign-in flow",
    url: "https://github.com/owner/repo/issues/123",
    status: "open",
    repository: {
      owner: "owner",
      name: "repo",
    },
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "priority", color: "#0075ca" },
    ],
    commentCount: 5,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  };

  it("should render card with title", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText("Fix authentication bug in sign-in flow")).toBeInTheDocument();
  });

  it("should render repository name", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText("owner/repo")).toBeInTheDocument();
  });

  it("should render issue number", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText("#123")).toBeInTheDocument();
  });

  it("should render status badge with correct text", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("should render comment count when present", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should not render comment count when zero", () => {
    const dataWithNoComments = { ...mockCardData, commentCount: 0 };
    render(<Card data={dataWithNoComments} />);

    // The number 0 should not appear in the document
    const commentSection = screen.queryByText("0");
    expect(commentSection).not.toBeInTheDocument();
  });

  it("should render labels", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("priority")).toBeInTheDocument();
  });

  it("should display overflow indicator for more than 3 labels", () => {
    const dataWithManyLabels = {
      ...mockCardData,
      labels: [
        { name: "bug", color: "#d73a4a" },
        { name: "priority", color: "#0075ca" },
        { name: "urgent", color: "#ff0000" },
        { name: "backend", color: "#00ff00" },
        { name: "frontend", color: "#0000ff" },
      ],
    };
    render(<Card data={dataWithManyLabels} />);

    // Should show first 3 labels
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("priority")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();

    // Should show "+2" for remaining labels
    expect(screen.getByText("+2")).toBeInTheDocument();

    // Should NOT show 4th and 5th labels
    expect(screen.queryByText("backend")).not.toBeInTheDocument();
    expect(screen.queryByText("frontend")).not.toBeInTheDocument();
  });

  it("should render as a link with correct href", () => {
    render(<Card data={mockCardData} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://github.com/owner/repo/issues/123");
  });

  it("should have target and rel attributes for external link", () => {
    render(<Card data={mockCardData} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should display relative time correctly", () => {
    render(<Card data={mockCardData} />);
    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
  });

  it("should render closed status correctly", () => {
    const closedCard = { ...mockCardData, status: "closed" as const };
    render(<Card data={closedCard} />);
    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("should render merged status correctly", () => {
    const mergedCard = { ...mockCardData, status: "merged" as const };
    render(<Card data={mergedCard} />);
    expect(screen.getByText("merged")).toBeInTheDocument();
  });

  it("should render draft status correctly", () => {
    const draftCard = { ...mockCardData, status: "draft" as const };
    render(<Card data={draftCard} />);
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("should have proper hover and focus classes", () => {
    render(<Card data={mockCardData} />);
    const link = screen.getByRole("link");

    expect(link).toHaveClass("group");
    expect(link).toHaveClass("hover:scale-[1.01]");
    expect(link).toHaveClass("focus:ring-2");
    expect(link).toHaveClass("focus:ring-green-500");
  });

  it("should render repository icon SVG", () => {
    const { container } = render(<Card data={mockCardData} />);
    const svg = container.querySelector('svg[viewBox="0 0 16 16"]');
    expect(svg).toBeInTheDocument();
  });

  it("should handle long titles with line clamping", () => {
    const longTitleCard = {
      ...mockCardData,
      title:
        "This is a very long title that should be clamped to two lines maximum and not overflow the card container",
    };
    const { container } = render(<Card data={longTitleCard} />);
    const titleElement = container.querySelector("h3");

    expect(titleElement).toHaveClass("line-clamp-2");
  });

  it("should render with no labels", () => {
    const noLabelsCard = { ...mockCardData, labels: [] };
    render(<Card data={noLabelsCard} />);

    // Should still render other content
    expect(screen.getByText("Fix authentication bug in sign-in flow")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("should format time for recent items (minutes)", () => {
    const recentCard = {
      ...mockCardData,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    };
    render(<Card data={recentCard} />);
    expect(screen.getByText(/15 minutes ago/)).toBeInTheDocument();
  });

  it("should format time for older items (days)", () => {
    const oldCard = {
      ...mockCardData,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    };
    render(<Card data={oldCard} />);
    expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
  });
});
