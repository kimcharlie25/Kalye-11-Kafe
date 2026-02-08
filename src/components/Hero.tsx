import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white py-24 px-4 border-b border-black">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-sans font-black text-black mb-6 animate-fade-in uppercase tracking-tighter">
          Authentic Taiwanese Dimsum
          <span className="block text-gray-400 mt-2">Kalye 11 Kafe</span>
        </h1>
        <p className="text-xl text-black font-medium mb-12 max-w-2xl mx-auto animate-slide-up uppercase tracking-widest opacity-70">
          Timeless Taiwanese Flavors, Freshly Made
        </p>
        <div className="flex justify-center">
          <a
            href="#dim-sum"
            className="bg-black text-white px-10 py-4 rounded-none hover:bg-white hover:text-black border-2 border-black transition-all duration-300 transform font-bold uppercase tracking-widest"
          >
            Explore Menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;