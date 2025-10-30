import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "../globals.css";
import "leaflet/dist/leaflet.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import {CssBaseline} from "@mui/material";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v15-appRouter";
import {AuthProvider} from "@/features/auth/AuthContext";
import {TenantProvider} from "@/features/tenants/TenantContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "blessings",
    description: "Shree Krupa Intranet",
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppRouterCacheProvider options={{enableCssLayer: true}}>
            <AuthProvider>
                <TenantProvider>
                    <CssBaseline/>
                    {children}
                </TenantProvider>
            </AuthProvider>
        </AppRouterCacheProvider>
        </body>
        </html>
    );
}