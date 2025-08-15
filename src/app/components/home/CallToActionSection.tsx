import Link from 'next/link';

export default function CallToActionSection() {
  return (
    <section className="py-16 bg-[var(--primary-blue)] text-white md:py-24">
      <div className="container px-4 mx-auto text-center">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
          Ready to Grow Your Business Across Continents?
        </h2>
        <p className="max-w-2xl mx-auto mb-10 text-lg text-gray-200 md:text-xl">
          Take the next step in your global expansion. Register for free access or showcase your business to thousands of potential partners.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup" className="px-8 py-3 font-semibold text-white bg-[var(--cta-emerald)] rounded-md hover:bg-emerald-700 transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75 w-full sm:w-auto">
            Join Directory - It’s Free!
          </Link>
          <Link href="/dashboard/listings/new" className="px-8 py-3 font-semibold text-[var(--primary-blue)] bg-[var(--accent-gold)] rounded-md hover:bg-yellow-400 transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 w-full sm:w-auto">
            List Your Business
          </Link>
        </div>
      </div>
    </section>
  );
}
