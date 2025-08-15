import { CpuChipIcon, BeakerIcon, BuildingOffice2Icon, TruckIcon, BanknotesIcon, GlobeAltIcon } from '@heroicons/react/24/outline'; // Example icons

export default function CategoriesSection() {
  const categories = [
    {
      id: 1,
      name: "Technology & IT",
      icon: CpuChipIcon,
      description: "Software, hardware, IT services, and telecommunications."
    },
    {
      id: 2,
      name: "Manufacturing",
      icon: BuildingOffice2Icon,
      description: "Industrial goods, machinery, textiles, and consumer products."
    },
    {
      id: 3,
      name: "Agriculture",
      icon: GlobeAltIcon, // Placeholder, consider a more specific agriculture icon
      description: "Farming, livestock, agro-processing, and fisheries."
    },
    {
      id: 4,
      name: "Healthcare & Pharma",
      icon: BeakerIcon,
      description: "Medical services, pharmaceuticals, and healthcare technology."
    },
    {
      id: 5,
      name: "Logistics & Transport",
      icon: TruckIcon,
      description: "Shipping, warehousing, supply chain, and transportation services."
    },
    {
      id: 6,
      name: "Finance & Investment",
      icon: BanknotesIcon,
      description: "Banking, investment firms, fintech, and financial consulting."
    }
  ];

  return (
    <section className="py-16 bg-white md:py-24">
      <div className="container px-4 mx-auto">
        <h2 className="mb-12 text-3xl font-bold text-center text-[var(--primary-blue)] md:text-4xl">
          Explore Top Categories
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-8">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex flex-col items-center p-6 text-center transition-all duration-300 transform bg-gray-100 rounded-lg shadow-sm hover:shadow-xl hover:scale-105 group"
            >
              <div className="flex items-center justify-center mb-5 text-white bg-[var(--primary-blue)] rounded-full w-16 h-16 transition-colors duration-300 group-hover:bg-[var(--accent-gold)]">
                <category.icon className="w-8 h-8 transition-colors duration-300 group-hover:text-[var(--primary-blue)]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[var(--primary-blue)]">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
