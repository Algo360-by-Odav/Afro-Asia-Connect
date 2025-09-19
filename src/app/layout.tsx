import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from './components/layout/Navbar'; // Import the Navbar
import { AuthProvider } from '../context/AuthContext';
import { SupabaseRealtimeProvider } from '../context/SupabaseRealtimeContext';
import { SupabaseStatus } from '../components/ui/SupabaseStatus';
import FloatingChatButton from './components/messaging/FloatingChatButton';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientWrapper from '../components/ClientWrapper';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "AfroAsiaConnect",
  description: "Connecting Trade Across Continents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <ClientWrapper>
          <AuthProvider>
            <SupabaseRealtimeProvider>
              <Navbar />
              <main>{children}</main>
              <FloatingChatButton />
              <SupabaseStatus />
            </SupabaseRealtimeProvider>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AuthProvider>
        </ClientWrapper>
      </body>
    </html>
  );
}
