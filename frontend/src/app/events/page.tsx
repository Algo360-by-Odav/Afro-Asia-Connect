"use client";

import React from 'react';

const upcomingEvents = [
  {
    id: 1,
    title: 'Global Trade & Investment Summit 2025',
    date: 'October 15-17, 2025',
    location: 'Virtual Event / Singapore',
    description: 'Join industry leaders, policymakers, and innovators to discuss the future of global trade, investment opportunities, and sustainable development across Africa and Asia.',
    imageUrl: 'https://picsum.photos/seed/event1/600/400',
    link: '#',
  },
  {
    id: 2,
    title: 'Africa-Asia Tech Innovation Forum',
    date: 'November 5-6, 2025',
    location: 'Nairobi, Kenya',
    description: 'Explore cutting-edge technologies, foster collaborations, and connect with startups and investors shaping the tech landscape in African and Asian markets.',
    imageUrl: 'https://picsum.photos/seed/event2/600/400',
    link: '#',
  },
  {
    id: 3,
    title: 'Sustainable Agriculture & Food Security Conference',
    date: 'December 1-3, 2025',
    location: 'Online Webinar Series',
    description: 'A series of expert-led webinars focusing on sustainable farming practices, food supply chain resilience, and innovative solutions for food security challenges.',
    imageUrl: 'https://picsum.photos/seed/event3/600/400',
    link: '#',
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Upcoming Events & Webinars
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Stay informed and connected. Join our events to network, learn, and grow your business.
          </p>
        </header>

        <div className="space-y-12">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="md:flex bg-white shadow-xl rounded-lg overflow-hidden">
              <div className="md:w-1/3">
                <img className="h-64 w-full object-cover md:h-full" src={event.imageUrl} alt={event.title} />
              </div>
              <div className="md:w-2/3 p-8">
                <h2 className="text-2xl font-bold text-sky-700 mb-2">{event.title}</h2>
                <p className="text-sm text-gray-500 mb-1"><span className="font-semibold">Date:</span> {event.date}</p>
                <p className="text-sm text-gray-500 mb-4"><span className="font-semibold">Location:</span> {event.location}</p>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {event.description}
                </p>
                <a 
                  href={event.link} 
                  className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
                >
                  Learn More & Register
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Past Events Archive</h2>
          <p className="text-gray-600">
            [Placeholder for links to recordings or summaries of past events.]
          </p>
          <a href="#" className="mt-2 inline-block text-sky-600 hover:text-sky-800 font-medium">
            Explore Past Events &rarr;
          </a>
        </div>

        <footer className="mt-16 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} AfroAsiaConnect. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
