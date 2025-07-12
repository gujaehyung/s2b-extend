'use client';

import { useState } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import AutomationDemo from './components/AutomationDemo';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <AutomationDemo />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
