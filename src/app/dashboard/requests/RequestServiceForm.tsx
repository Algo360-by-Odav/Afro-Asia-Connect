"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

const SERVICES = [
  "International Shipping (Sea/Air)",
  "Inland Transportation / Trucking",
  "Customs Clearance",
  "Export Documentation (BL, CO, LC, etc.)",
  "Quality Control / Inspection",
  "Trade Finance Support",
  "Business Consultancy",
];

export default function RequestServiceForm({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const COUNTRIES = [
    // Africa
    "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cabo Verde","Cameroon","Central African Republic","Chad","Comoros","Democratic Republic of the Congo","Republic of the Congo","Djibouti","Egypt","Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon","Gambia","Ghana","Guinea","Guinea-Bissau","Ivory Coast","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger","Nigeria","Rwanda","Sao Tome and Principe","Senegal","Seychelles","Sierra Leone","Somalia","South Africa","South Sudan","Sudan","Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe",
    // Asia
    "Afghanistan","Armenia","Azerbaijan","Bahrain","Bangladesh","Bhutan","Brunei","Cambodia","China","Cyprus","Georgia","India","Indonesia","Iran","Iraq","Israel","Japan","Jordan","Kazakhstan","Kuwait","Kyrgyzstan","Laos","Lebanon","Malaysia","Maldives","Mongolia","Myanmar","Nepal","North Korea","Oman","Pakistan","Palestine","Philippines","Qatar","Russia","Saudi Arabia","Singapore","South Korea","Sri Lanka","Syria","Taiwan","Tajikistan","Thailand","Timor-Leste","Turkey","Turkmenistan","United Arab Emirates","Uzbekistan","Vietnam","Yemen"
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    country: "",
    services: [] as string[],
    otherService: "",
    description: "",
    startDate: "",
    urgency: "Flexible",
    attachments: [] as File[],
    consent: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" && name === "consent" ? checked : value,
    }));
  };

  const toggleService = (service: string) => {
    setFormData((prev) => {
      const exists = prev.services.includes(service);
      const services = exists ? prev.services.filter((s) => s !== service) : [...prev.services, service];
      return { ...prev, services };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, attachments: files }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      setError("You must agree to the terms and conditions.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "attachments") {
          (value as File[]).forEach((file) => body.append("attachments", file));
        } else if (key === "services") {
          (value as string[]).forEach((s) => body.append("services", s));
        } else {
          body.append(key, value as any);
        }
      });

      const res = await fetch(`${API_BASE_URL}/service-requests`, {
        method: "POST",
        body,
      });
      if (!res.ok) throw new Error("Failed to submit request");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-semibold mb-4">Thank you!</h2>
        <p>Your service request has been sent to <strong>{companyName}</strong>. You will be contacted shortly.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">{error}</div>}

      {/* Contact Info */}
      <section>
        <h3 className="text-lg font-semibold mb-4">1. Your Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required className="border border-slate-300 rounded-md px-3 py-2" />
          <input name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} className="border border-slate-300 rounded-md px-3 py-2" />
          <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="border border-slate-300 rounded-md px-3 py-2" />
          <input name="phone" placeholder="WhatsApp / Phone" value={formData.phone} onChange={handleChange} className="border border-slate-300 rounded-md px-3 py-2" />
          <select name="country" value={formData.country} onChange={handleChange} className="border border-slate-300 rounded-md px-3 py-2 md:col-span-2">
            <option value="">Select Country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Services */}
      <section>
        <h3 className="text-lg font-semibold mb-4">2. Select Services You Need</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SERVICES.map((service) => (
            <label key={service} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.services.includes(service)}
                onChange={() => toggleService(service)}
              />
              <span>{service}</span>
            </label>
          ))}
          <label className="md:col-span-2">
            Others:
            <input
              name="otherService"
              value={formData.otherService}
              onChange={handleChange}
              placeholder="Specify other"
              className="w-full border border-slate-300 rounded-md px-3 py-2 mt-1"
            />
          </label>
        </div>
      </section>

      {/* Description */}
      <section>
        <h3 className="text-lg font-semibold mb-4">3. Service Description / Request Details</h3>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Tell us more about what you need..."
          className="w-full border border-slate-300 rounded-md px-3 py-2"
        />
      </section>

      {/* Timeline */}
      <section>
        <h3 className="text-lg font-semibold mb-4">4. Preferred Timeline / Schedule</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Desired Start Date</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="border border-slate-300 rounded-md px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm mb-1">Urgency</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange} className="border border-slate-300 rounded-md px-3 py-2">
              <option>Flexible</option>
              <option>Urgent (Within 7 days)</option>
              <option>Scheduled (Specify date)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section>
        <h3 className="text-lg font-semibold mb-4">5. Optional Attachments</h3>
        <input type="file" multiple onChange={handleFileChange} className="border border-slate-300 rounded-md px-3 py-2" />
      </section>

      {/* Consent */}
      <section>
        <h3 className="text-lg font-semibold mb-4">6. Consent & Submission</h3>
        <label className="flex items-center space-x-2">
          <input type="checkbox" name="consent" checked={formData.consent} onChange={handleChange} />
          <span>I agree to the terms and conditions.</span>
        </label>
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-8 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
