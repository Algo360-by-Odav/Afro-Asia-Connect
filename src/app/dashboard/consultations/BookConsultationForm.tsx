"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

const SERVICE_OPTIONS = [
  { label: "15-min Intro Call (Free)", value: "intro_call", price: 0 },
  { label: "30-min General Trade Advice", value: "general_advice", price: 0 },
  { label: "60-min Strategy Session (Paid)", value: "strategy_session", price: 100 },
  { label: "Custom Request", value: "custom", price: 0 },
];

export default function BookConsultationForm({ companyName }: { companyName: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    serviceType: "intro_call",
    date: "",
    time: "",
    name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
    email: user?.email || "",
    company: "",
    topic: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, timezone, companyName }),
      });
      if (!res.ok) throw new Error("Failed to book consultation.");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-semibold mb-4">Thanks! Your appointment with {companyName} is confirmed.</h2>
        <p>We have emailed the details. You may add it to your calendar.</p>
        <button
          className="mt-6 px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">{error}</div>}

      {/* Service type */}
      <section>
        <h3 className="text-lg font-semibold mb-4">1. Pick a Service Type</h3>
        <div className="space-y-2">
          {SERVICE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center space-x-2">
              <input
                type="radio"
                name="serviceType"
                value={opt.value}
                checked={formData.serviceType === opt.value}
                onChange={handleChange}
              />
              <span>
                {opt.label}
                {opt.price > 0 && (
                  <span className="ml-1 text-slate-500">(${opt.price})</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Date & time */}
      <section>
        <h3 className="text-lg font-semibold mb-4">2. Choose Date & Time</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="border border-slate-300 rounded-md px-3 py-2"
          />
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            className="border border-slate-300 rounded-md px-3 py-2"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          All times are shown in your local timezone ({timezone})
        </p>
      </section>

      {/* Details */}
      <section>
        <h3 className="text-lg font-semibold mb-4">3. Appointment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border border-slate-300 rounded-md px-3 py-2"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border border-slate-300 rounded-md px-3 py-2"
          />
          <input
            name="company"
            placeholder="Company (optional)"
            value={formData.company}
            onChange={handleChange}
            className="border border-slate-300 rounded-md px-3 py-2 md:col-span-2"
          />
          <input
            name="topic"
            placeholder="Consultation Topic"
            value={formData.topic}
            onChange={handleChange}
            className="border border-slate-300 rounded-md px-3 py-2 md:col-span-2"
          />
          <textarea
            name="notes"
            placeholder="Notes / Questions"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="border border-slate-300 rounded-md px-3 py-2 md:col-span-2"
          />
        </div>
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="px-8 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
      >
        {submitting ? "Booking..." : "Confirm Booking"}
      </button>
    </form>
  );
}
