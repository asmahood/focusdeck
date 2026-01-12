import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setInstallation } from "@/lib/redis";
import { createRequestLogger } from "@/lib/logging/logger";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId, {
    endpoint: "/api/github-app/callback",
    method: "GET",
  });

  try {
    // 1. Verify user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      log.warn("Unauthenticated user attempted app installation callback");
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // 2. Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const installationId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action");

    log.info("GitHub App callback received", {
      installationId,
      setupAction,
      userId: session.user.id,
    });

    // 3. Validate installation_id
    if (!installationId || isNaN(parseInt(installationId, 10))) {
      log.warn("Invalid or missing installation_id", { installationId });
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("app_install", "error");
      homeUrl.searchParams.set("error_message", "invalid_installation");
      return NextResponse.redirect(homeUrl);
    }

    // 4. Store installation mapping in Redis
    const githubUserId = session.user.id;
    await setInstallation(githubUserId, parseInt(installationId, 10));

    log.info("Installation stored successfully", {
      githubUserId,
      installationId,
    });

    // 5. Redirect back to home with success message
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("app_install", "success");
    return NextResponse.redirect(homeUrl);
  } catch (error) {
    log.error("Error handling GitHub App callback", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("app_install", "error");
    homeUrl.searchParams.set("error_message", "server_error");
    return NextResponse.redirect(homeUrl);
  }
}
