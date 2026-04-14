import "./globals.css";

export const metadata = {
  title: "SuiteLens — SuiteScript Code Reviewer for VS Code",
  description:
    "AI-powered SuiteScript code review inside VS Code. Catches governance risks, performance anti-patterns, and scalability failures before they hit production.",
  keywords: [
    "SuiteScript review",
    "SuiteScript code review",
    "NetSuite script audit",
    "SuiteScript governance",
    "SuiteScript performance",
    "NetSuite code analysis",
    "SuiteScript anti-patterns",
    "NetSuite script security",
    "SuiteLens",
    "VS Code extension",
  ],
  authors: [{ name: "Adaptive Solutions Group" }],
  openGraph: {
    type: "website",
    title: "SuiteLens — SuiteScript Code Reviewer for VS Code",
    description:
      "Highlight SuiteScript. Get a production-grade review. Inside your editor.",
    siteName: "SuiteLens by Adaptive Solutions Group",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
