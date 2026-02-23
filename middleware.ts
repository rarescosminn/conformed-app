// /middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
    "/onboarding",
    "/_next",
    "/favicon",
    "/icons",
    "/images",
    "/public",
    "/api",
];

function isPublic(req: NextRequest) {
    const { pathname } = req.nextUrl;
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();

    if (isPublic(req)) return NextResponse.next();

    // Flag-uri din cookie (fallback până la backend):
    //  - features.sectionsPersonalizate: "1" = ON
    //  - onboardingCompleted: "1" = finalizat
    const featuresFlag = req.cookies.get("features_sectionsPersonalizate")?.value === "1";
    const onboardingCompleted = req.cookies.get("onboardingCompleted")?.value === "1";

    if (featuresFlag && !onboardingCompleted) {
        url.pathname = "/onboarding";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
