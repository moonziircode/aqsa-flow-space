import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { useGlobalUndoHotkey } from "@/lib/undo";
import { useEffect } from "react";
import { ensureSelectOptions } from "@/lib/selectOptions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AqsaSpace · Field Workspace" },
      { name: "description", content: "Field service & task management workspace for Aqsa." },
      { property: "og:title", content: "AqsaSpace · Field Workspace" },
      { name: "twitter:title", content: "AqsaSpace · Field Workspace" },
      { property: "og:description", content: "Field service & task management workspace for Aqsa." },
      { name: "twitter:description", content: "Field service & task management workspace for Aqsa." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c041ca41-a917-40cb-abfa-11dfec707fc8/id-preview-f6ea049c--e403c309-1f8d-4d8b-a203-b8bb0c6711dc.lovable.app-1776789533383.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c041ca41-a917-40cb-abfa-11dfec707fc8/id-preview-f6ea049c--e403c309-1f8d-4d8b-a203-b8bb0c6711dc.lovable.app-1776789533383.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useGlobalUndoHotkey();
  useEffect(() => {
    ensureSelectOptions().catch(() => {});
  }, []);
  return (
    <>
      <AppShell />
      <Toaster position="top-right" />
    </>
  );
}
