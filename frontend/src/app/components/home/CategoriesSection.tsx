import { CpuChipIcon, TruckIcon, BanknotesIcon, WrenchScrewdriverIcon, CircleStackIcon, HeartIcon, BriefcaseIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export default function CategoriesSection() {
  const categories = [
    {
      id: 1,
      name: "Technology & IT",
      icon: CpuChipIcon,
      description: "Innovations in software, hardware, IT services, telecommunications, and digital solutions."
    },
    {
      id: 2,
      name: "Manufacturing & Industrial",
      icon: WrenchScrewdriverIcon,
      description: "Production of industrial goods, machinery, equipment, textiles, and consumer products."
    },
    {
      id: 3,
      name: "Agriculture & Agribusiness",
      icon: CircleStackIcon,
      description: "From farming and raw materials to food processing and export."
    },
    {
      id: 4,
      name: "Healthcare & Pharmaceuticals",
      icon: HeartIcon,
      description: "Medical services, pharmaceutical products, healthcare technology, and wellness solutions."
    },
    {
      id: 5,
      name: "Logistics & Supply Chain",
      icon: TruckIcon,
      description: "Efficient shipping, warehousing, supply chain management, and transportation solutions."
    },
    {
      id: 6,
      name: "Business & Professional Services",
      icon: BriefcaseIcon,
      description: "Expert advice in legal, marketing, management, and other professional fields."
    },
    {
      id: 7,
      name: "International Trade & Export",
      icon: ArrowsRightLeftIcon,
      description: "Facilitating cross-border commerce, import/export services, and global market access."
    },
    {
      id: 8,
      name: "Finance & Investment",
      icon: BanknotesIcon,
      description: "Banking, investment firms, fintech, and financial consulting."
    }
  ];

  return (
    <section className="py-16 bg-white/15 backdrop-blur-sm md:py-24">
      <div className="container px-4 mx-auto">
        <h2 className="mb-12 text-3xl font-bold text-center text-[var(--primary-blue)] md:text-4xl">
          Discover Key Business Sectors
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-8">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex flex-col items-center p-6 text-center transition-all duration-300 transform bg-gray-100 rounded-lg shadow-sm hover:shadow-xl hover:scale-105 group"
            >
              <div className="flex items-center justify-center mb-5 text-white bg-[var(--primary-blue)] rounded-full w-16 h-16 transition-colors duration-300 group-hover:bg-[var(--accent-gold)]">
                <category.icon className="w-8 h-8 transition-colors duration-300 group-hover:text-[var(--primary-blue)]" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold text-[var(--primary-blue)]">{category.name}</h3>
              <p className="text-base text-gray-700">{category.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
