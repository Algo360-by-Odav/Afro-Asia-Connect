import { ShieldCheckIcon, LightBulbIcon, UserGroupIcon } from '@heroicons/react/24/outline'; // Example icons

export default function WhyJoinSection() {
  const benefits = [
    {
      id: 1,
      title: "Get Leads",
      description: "Connect with potential buyers and partners actively seeking your products and services.",
      icon: LightBulbIcon,
    },
    {
      id: 2,
      title: "Build Trust",
      description: "Showcase your credibility with a verified profile and build confidence among a global audience.",
      icon: ShieldCheckIcon,
    },
    {
      id: 3,
      title: "Be Seen",
      description: "Expand your market reach. Gain prominent visibility across diverse African and Asian economies.",
      icon: UserGroupIcon,
    },
  ];

  return (
    <section className="py-16 bg-white/15 backdrop-blur-sm md:py-24">
      <div className="container px-4 mx-auto">
        <h2 className="mb-12 text-3xl font-bold text-center text-[var(--primary-blue)] md:text-4xl">
          Why Join AfroAsiaConnect?
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="p-8 text-center bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-center mx-auto mb-6 text-white bg-[var(--primary-blue)] rounded-full w-14 h-14">
                <benefit.icon className="w-8 h-8" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-[var(--primary-blue)]">{benefit.title}</h3>
              <p className="text-base text-gray-700">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
