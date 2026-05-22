import React from 'react';
import { Link } from 'react-router-dom';
import { BeforeAfterSlider } from '../components';
import { Sparkles, Zap, Image, History, Shield, Globe, ArrowRight, Star } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex flex-col items-center w-full min-h-screen text-white">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#B0FF00]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-white/10 text-xs font-bold uppercase tracking-widest text-[#B0FF00] mb-6 animate-pulse">
            <Sparkles className="w-4 h-4" /> Next-Gen AI Image Stylization
          </div>
          
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8">
            Transform Photos Into <br />
            <span className="bg-gradient-to-r from-[#B0FF00] via-teal-400 to-[#B0FF00] bg-clip-text text-transparent bg-300% animate-gradient-flow">
              Studio-Grade Art
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12">
            Instantly cartoonize, paint, or sketch your images with PIXIT's high-speed neural rendering pipeline. Configurable slider adjustments, community showcase, and HD exports.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-md">
            <Link 
              to="/workspace"
              className="group flex items-center justify-center gap-2 bg-[#B0FF00] text-black font-extrabold px-8 py-4 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(176,255,0,0.4)] transition duration-200 cursor-pointer"
            >
              Open Neural Editor <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/gallery"
              className="flex items-center justify-center gap-2 bg-[#111115] border border-white/10 text-white font-bold px-8 py-4 rounded-xl hover:bg-[#181822] hover:border-white/20 transition duration-200 cursor-pointer"
            >
              Community Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Demonstration Section */}
      <section className="w-full max-w-5xl px-4 py-10 flex flex-col items-center">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Compare Styles in Real-Time</h2>
          <p className="text-gray-400 text-sm max-w-lg">Drag the center slider to witness our high-resolution cel-shaded anime stylization in action.</p>
        </div>
        
        <div className="w-full max-w-4xl">
          <BeforeAfterSlider 
            beforeImage="/demo_original.png" 
            afterImage="/demo_stylized.png" 
            height="h-[300px] md:h-[500px]"
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 bg-black/40 border-t border-b border-white/5 my-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">SaaS Features Built for Creators</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Explore premium editing pipelines and project sharing features designed to optimize your visual workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#111115]/60 border border-white/10 rounded-2xl p-8 hover:border-[#B0FF00]/40 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#B0FF00]/5 rounded-bl-full pointer-events-none"></div>
              <Zap className="w-10 h-10 text-[#B0FF00] mb-6" />
              <h3 className="text-xl font-bold mb-3">6+ AI Stylization Filters</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Cartoonization, watercolor blending, graphite sketch, structural oil paint, and background removal at the click of a button.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111115]/60 border border-white/10 rounded-2xl p-8 hover:border-teal-400/40 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-bl-full pointer-events-none"></div>
              <Image className="w-10 h-10 text-teal-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Granular Detail Sliders</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tweak edge intensities, brightness, contrast, and compression outputs in real-time. What you see is exactly what gets built.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111115]/60 border border-white/10 rounded-2xl p-8 hover:border-[#B0FF00]/40 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#B0FF00]/5 rounded-bl-full pointer-events-none"></div>
              <History className="w-10 h-10 text-[#B0FF00] mb-6" />
              <h3 className="text-xl font-bold mb-3">Saved Projects Library</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Never lose your work. Your dashboard holds a complete database-backed history of all uploaded images and custom-applied styles.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#111115]/60 border border-white/10 rounded-2xl p-8 hover:border-orange-500/40 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none"></div>
              <Shield className="w-10 h-10 text-orange-500 mb-6" />
              <h3 className="text-xl font-bold mb-3">Unsupervised BG Cut</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Isolate subjects effortlessly. Our built-in local GrabCut segmentation pipeline detects center objects and renders crisp transparent layers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#111115]/60 border border-white/10 rounded-2xl p-8 hover:border-[#B0FF00]/40 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#B0FF00]/5 rounded-bl-full pointer-events-none"></div>
              <Globe className="w-10 h-10 text-[#B0FF00] mb-6" />
              <h3 className="text-xl font-bold mb-3">Community Showcase</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Make your creations public with a simple toggle. View trending styles from other creators and inspect their exact settings.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#111115]/60 border border-white/10 rounded-2xl p-8 hover:border-teal-400/40 transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-bl-full pointer-events-none"></div>
              <Sparkles className="w-10 h-10 text-teal-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">HD WebP Outputs</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Export processed images instantly. Choose from PNG or optimized high-definition WebP formats for quick online sharing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Mock Section */}
      <section className="w-full max-w-6xl px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Flexible Tiers for Every Studio</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Get started for free or upgrade to support continuous, high-definition AI rendering pipelines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="bg-[#111115] border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-white mb-2">Free Starter</h3>
              <p className="text-gray-500 text-sm mb-6">Explore the neural canvas</p>
              <div className="text-3xl font-black mb-6">$0 <span className="text-sm font-normal text-gray-500">/ forever</span></div>
              <ul className="space-y-3.5 mb-8">
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Standard filter collection</li>
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ WebP low-resolution exports</li>
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Save up to 5 projects</li>
                <li className="text-gray-600 text-sm flex items-center gap-2.5 line-through">✗ Custom detail sliders</li>
                <li className="text-gray-600 text-sm flex items-center gap-2.5 line-through">✗ GrabCut background removal</li>
              </ul>
            </div>
            <Link to="/workspace" className="w-full py-3 bg-white/10 text-white font-bold text-center rounded-xl hover:bg-white/20 transition cursor-pointer">
              Get Started
            </Link>
          </div>

          {/* Popular Creator Tier */}
          <div className="bg-[#111115] border-2 border-[#B0FF00] rounded-2xl p-8 flex flex-col justify-between hover:-translate-y-1 transition duration-300 relative shadow-[0_10px_35px_rgba(176,255,0,0.15)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#B0FF00] text-black text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest">
              Most Popular
            </span>
            <div>
              <h3 className="text-xl font-extrabold text-white mb-2">Pro Creator</h3>
              <p className="text-gray-400 text-sm mb-6">Unleash advanced styling</p>
              <div className="text-3xl font-black mb-6">$12 <span className="text-sm font-normal text-gray-400">/ month</span></div>
              <ul className="space-y-3.5 mb-8">
                <li className="text-gray-200 text-sm flex items-center gap-2.5">✓ Full standard filter collection</li>
                <li className="text-gray-200 text-sm flex items-center gap-2.5">✓ Unlimited projects history</li>
                <li className="text-gray-200 text-sm flex items-center gap-2.5">✓ Adjust intensity & details</li>
                <li className="text-gray-200 text-sm flex items-center gap-2.5">✓ GrabCut subject isolation</li>
                <li className="text-gray-200 text-sm flex items-center gap-2.5">✓ High-definition WebP downloads</li>
              </ul>
            </div>
            <Link to="/workspace" className="w-full py-3 bg-[#B0FF00] text-black font-extrabold text-center rounded-xl hover:shadow-[0_6px_20px_rgba(176,255,0,0.3)] transition cursor-pointer">
              Go Pro
            </Link>
          </div>

          {/* Enterprise Studio Tier */}
          <div className="bg-[#111115] border border-white/10 rounded-2xl p-8 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div>
              <h3 className="text-xl font-extrabold text-white mb-2">Studio Elite</h3>
              <p className="text-gray-500 text-sm mb-6">For professional agencies</p>
              <div className="text-3xl font-black mb-6">$39 <span className="text-sm font-normal text-gray-500">/ month</span></div>
              <ul className="space-y-3.5 mb-8">
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Everything in Pro Creator</li>
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Bulk image processing API</li>
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Ultra-HD lossless exports</li>
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Priority server rendering</li>
                <li className="text-gray-400 text-sm flex items-center gap-2.5">✓ Custom watermark protection</li>
              </ul>
            </div>
            <Link to="/workspace" className="w-full py-3 bg-white/10 text-white font-bold text-center rounded-xl hover:bg-white/20 transition cursor-pointer">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full max-w-5xl px-4 py-20 border-t border-white/5 flex flex-col items-center">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Loved by Creative Engineers</h2>
          <p className="text-gray-400 text-sm max-w-md">Hear from developers and digital artists using PIXIT to draft UI mockups and stylize assets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="bg-[#111115]/50 border border-white/10 rounded-2xl p-8">
            <div className="flex gap-1 text-[#B0FF00] mb-4">
              <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-gray-300 text-sm italic mb-6 leading-relaxed">
              "The edge cartoonization output is highly crisp. I use it to style custom backgrounds for my web apps. The built-in GrabCut background cut works perfectly on center figures."
            </p>
            <div className="font-extrabold text-sm text-white">Leo Vance</div>
            <div className="text-gray-500 text-xs font-semibold">Front-End Lead, Apex Labs</div>
          </div>

          <div className="bg-[#111115]/50 border border-white/10 rounded-2xl p-8">
            <div className="flex gap-1 text-[#B0FF00] mb-4">
              <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-gray-300 text-sm italic mb-6 leading-relaxed">
              "Converting photos to watercolor layouts has never been faster. PIXIT's UI is beautiful, fast, and does exactly what's advertised. The community gallery details are extremely helpful."
            </p>
            <div className="font-extrabold text-sm text-white">Sasha Sterling</div>
            <div className="text-gray-500 text-xs font-semibold">Concept Artist & UI/UX Designer</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-white/5 text-center text-gray-600 text-xs font-semibold tracking-wider">
        © {new Date().getFullYear()} PIXIT INC. ALL RIGHTS RESERVED. POWERED BY OPENCV & FASTAPI.
      </footer>
    </div>
  );
};

export default Landing;
