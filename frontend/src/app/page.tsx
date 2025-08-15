import Link from 'next/link';
import Image from 'next/image'; // Keep Image import if you plan to use it, e.g., for a logo on this page

import HeroSection from './components/home/HeroSection';
import CategoriesSection from './components/home/CategoriesSection';
import FeaturedCompaniesSection from './components/home/FeaturedCompaniesSection';
import WhyJoinSection from './components/home/WhyJoinSection';
import CallToActionSection from './components/home/CallToActionSection';
import Footer from './components/layout/Footer';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        <div className="absolute inset-0">
          <img 
            src="/images/home-background.jpg" 
            alt="Global business connections" 
            className="w-full h-full object-cover object-center"
            style={{
              imageRendering: 'auto',
              filter: 'contrast(1.1) brightness(1.05) saturate(1.05)',
              willChange: 'transform'
            }}
          />
        </div>
      </div>
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <main className="relative flex min-h-screen flex-col items-center justify-start">
        <HeroSection />
        <CategoriesSection />
        <FeaturedCompaniesSection />
        <WhyJoinSection />
        <CallToActionSection />
        <Footer />
      </main>
    </div>
  );
}
