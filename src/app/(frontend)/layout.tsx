import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PlatformAuthGuard } from '@/components/PlatformAuthGuard';
import { ContentProtection } from '@/components/ContentProtection';

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ContentProtection />
      <PlatformAuthGuard>
        <div className="flex flex-col min-h-screen overflow-x-hidden">
          <Navbar />
          <main className="flex-1 overflow-x-hidden">{children}</main>
          <Footer />
        </div>
      </PlatformAuthGuard>
    </AuthProvider>
  );
}
