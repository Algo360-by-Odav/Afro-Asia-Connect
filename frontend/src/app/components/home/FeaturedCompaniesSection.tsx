"use client";

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// import required modules
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

export default function FeaturedCompaniesSection() {
  // Placeholder data - replace with actual data fetching and slider logic later
  const featuredCompanies = [
    {
      id: 1,
      name: "Nairobi Robotics Hub",
      logoUrl: "https://picsum.photos/seed/nrhlogo/150/150",
      country: "Kenya",
      countryFlagUrl: "https://picsum.photos/seed/kenyaflag/60/40",
      productSampleUrl: "https://picsum.photos/seed/nrhproduct/400/300",
      productDescription: "Advanced Agricultural Drones"
    },
    {
      id: 2,
      name: "Accra Fintech Innovators",
      logoUrl: "https://picsum.photos/seed/afilogo/150/150",
      country: "Ghana",
      countryFlagUrl: "https://picsum.photos/seed/ghanaflag/60/40",
      productSampleUrl: "https://picsum.photos/seed/afiproduct/400/300",
      productDescription: "Mobile Payment Solutions"
    },
    {
      id: 3,
      name: "Saigon Silk Exports",
      logoUrl: "https://picsum.photos/seed/sselogo/150/150",
      country: "Vietnam",
      countryFlagUrl: "https://picsum.photos/seed/vietnamflag/60/40",
      productSampleUrl: "https://picsum.photos/seed/sseproduct/400/300",
      productDescription: "Premium Handwoven Silk Textiles"
    },
    {
      id: 4,
      name: "Mumbai Pharma Group",
      logoUrl: "https://picsum.photos/seed/mpglogo/150/150",
      country: "India",
      countryFlagUrl: "https://picsum.photos/seed/indiaflag/60/40",
      productSampleUrl: "https://picsum.photos/seed/mpgproduct/400/300",
      productDescription: "Generic Pharmaceutical Manufacturing"
    },
    // Adding a few more for better slider visualization
    {
      id: 5,
      name: "Cairo Logistics Co.",
      logoUrl: "https://picsum.photos/seed/clclogo/150/150",
      country: "Egypt",
      countryFlagUrl: "https://picsum.photos/seed/egyptflag/60/40",
      productSampleUrl: "https://picsum.photos/seed/clcproduct/400/300",
      productDescription: "Cross-Continental Freight Solutions"
    },
    {
      id: 6,
      name: "Lagos Tech Solutions",
      logoUrl: "https://picsum.photos/seed/ltslogo/150/150",
      country: "Nigeria",
      countryFlagUrl: "https://picsum.photos/seed/nigeriaflag/60/40",
      productSampleUrl: "https://picsum.photos/seed/ltsproduct/400/300",
      productDescription: "Bespoke Software Development"
    }
  ];

  return (
    <section className="py-16 bg-white/15 backdrop-blur-sm md:py-24">
      <div className="container px-4 mx-auto">
        <h2 className="mb-12 text-3xl font-bold text-center text-[var(--primary-blue)] md:text-4xl">
          Featured Gold Members
        </h2>
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            // when window width is >= 640px
            640: {
              slidesPerView: 2,
              spaceBetween: 20
            },
            // when window width is >= 768px
            768: {
              slidesPerView: 3,
              spaceBetween: 30
            },
            // when window width is >= 1024px
            1024: {
              slidesPerView: 4,
              spaceBetween: 30
            }
          }}
          className="mySwiper w-full pb-10" // pb-10 to make space for pagination dots if they are outside
        >
          {featuredCompanies.map((company) => (
            <SwiperSlide key={company.id} className="h-full">
              {/* Ensure each card takes full height of the slide for consistent appearance */}
              <div className="flex flex-col h-full p-6 transition-shadow duration-300 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg">
                <div className="flex items-center justify-center mb-4 h-28 shrink-0">
                  <img src={company.logoUrl} alt={`${company.name} Logo`} className="max-w-full max-h-full p-2 bg-white rounded-md" />
                </div>
                <h3 className="mb-2 text-2xl font-semibold text-center text-[var(--primary-blue)]">{company.name}</h3>
                <div className="flex items-center justify-center mb-3 shrink-0">
                  <img src={company.countryFlagUrl} alt={`${company.country} Flag`} className="w-6 h-4 mr-2" />
                  <span className="text-sm text-gray-600">{company.country}</span>
                </div>
                <div className="mb-4 h-36 shrink-0">
                  <img src={company.productSampleUrl} alt={`Product sample from ${company.name}`} className="object-cover w-full h-full rounded-md" />
                </div>
                <p className="flex-grow text-base text-center text-gray-700">{company.productDescription}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
