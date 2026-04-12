import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "ScriptGuard — SuiteScript Code Reviewer",
  description:
    "Paste any SuiteScript and get a production-focused review. Governance risks, performance problems, security gaps, and anti-patterns — found in seconds.",
  keywords: [
    "SuiteScript review",
    "SuiteScript code review",
    "NetSuite script audit",
    "SuiteScript governance",
    "SuiteScript performance",
    "NetSuite code analysis",
    "SuiteScript anti-patterns",
    "NetSuite script security",
    "ScriptGuard",
  ],
  authors: [{ name: "Adaptive Solutions Group" }],
  openGraph: {
    type: "website",
    title: "ScriptGuard — SuiteScript Code Reviewer",
    description:
      "Paste any SuiteScript. Get a production-focused review in seconds.",
    siteName: "ScriptGuard by Adaptive Solutions Group",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-[family-name:var(--font-geist-sans)]`}
      >
        {children}
      </body>
    </html>
  );
}
