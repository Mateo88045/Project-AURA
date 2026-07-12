import ScrollProgress from '@/components/ScrollProgress';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Problem from '@/components/Problem';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Comparison from '@/components/Comparison';
import CTA from '@/components/CTA';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main className="overflow-hidden">
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <Comparison />
        <CTA />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
