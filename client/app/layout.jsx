import '../src/styles/globals.css';
import Navbar from '../src/components/layout/Navbar.jsx';
import Footer from '../src/components/layout/Footer.jsx';
import Providers from './providers.jsx';

export const metadata = {
  title: {
    default: 'KnowWork — Career Intelligence Platform',
    template: '%s | KnowWork',
  },
  description: 'Discover real career journeys, salary analytics, and expert roadmaps to navigate your path to any dream job.',
  keywords: ['career roadmap', 'salary analytics', 'job guide', 'career intelligence', 'India jobs'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'KnowWork',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-bg-primary font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
