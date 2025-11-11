import { NextRequest, NextResponse } from "next/server";
import { fetchIssuesAssigned } from "@/lib/fetchers";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");

    const result = await fetchIssuesAssigned({
      cursor: cursor || null,
      first: 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching assigned issues:", error);

    return NextResponse.json(
      {
        error: {
          type: "UNKNOWN",
          message: error instanceof Error ? error.message : "Failed to fetch assigned issues",
          retryable: true,
        },
      },
      { status: 500 },
    );
  }
}
