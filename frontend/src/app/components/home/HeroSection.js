export default function HeroSection() {
  return (
    <section className="bg-[var(--background-light-gray)] py-20 md:py-32 w-full">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--primary-blue)] mb-6">
          Connect, Trade, and Grow with AfroAsiaConnect
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
          Discover businesses, services, and opportunities across African and Asian markets. Your premier B2B directory.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form className="flex items-center">
            <input 
              type="search" 
              placeholder="Search by company name, product, service, or keyword..." 
              className="w-full px-5 py-3 text-gray-700 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)] focus:border-transparent"
            />
            <button 
              type="submit" 
              className="bg-[var(--cta-emerald)] text-white px-6 py-3 rounded-r-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 transition duration-150"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick Filters Placeholder */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4">
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Technology
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Agriculture
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Manufacturing
          </button>
          <button className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition duration-150">
            Consultancy
          </button>
        </div>
      </div>
    </section>
  );
}
