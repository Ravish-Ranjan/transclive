import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Noto_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";

const notoSerifHeading = Noto_Serif({
	subsets: ["latin"],
	variable: "--font-heading",
});

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "TransClive",
	description: "Real-time audio transcriber",
	manifest: "/manifest.json",
	applicationName: "TransClive",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "TransClive",
	},
	formatDetection: {
		telephone: false,
	},
	icons: {
		icon: "/icons/icon-192.png",
		apple: "/icons/icon-192.png",
	},
};

export const viewport = {
	themeColor: "#0f172a",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={cn(
				"h-full",
				"antialiased",
				geistSans.variable,
				geistMono.variable,
				"font-sans",
				outfit.variable,
				notoSerifHeading.variable,
			)}
		>
			<body className="min-h-full flex flex-col">
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
