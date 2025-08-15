"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export default function ProviderConfigForm() {
  const { user, token } = useAuth();
  const [allowUrgent, setAllowUrgent] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/providers/${user.id}/config`)
      .then((r) => r.json())
      .then((cfg) => {
        setAllowUrgent(cfg.allowUrgent);
        setDates(cfg.unavailableDates || []);
      });
  }, [user]);

  function save() {
    fetch(`${API_BASE_URL}/providers/${user!.id}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ allowUrgent, unavailableDates: dates }),
    }).then(() => alert("Saved"));
  }

  return (
    <div className="space-y-4 mt-8">
      <label className="flex items-center space-x-2">
        <input type="checkbox" checked={allowUrgent} onChange={(e) => setAllowUrgent(e.target.checked)} />
        <span>Allow urgent bookings (&lt;24h)</span>
      </label>

      <div>
        <h4 className="font-medium mb-1">Unavailable Dates</h4>
        <div className="flex space-x-2 items-center mb-2">
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="border px-2 py-1" />
          <button
            className="px-2 py-1 bg-emerald-600 text-white rounded"
            onClick={() => {
              if (newDate && !dates.includes(newDate)) setDates([...dates, newDate]);
              setNewDate("");
            }}
          >
            Add
          </button>
        </div>
        {dates.length ? (
          <ul className="list-disc ml-6">
            {dates.map((d) => (
              <li key={d} className="flex items-center justify-between">
                <span>{d}</span>
                <button className="text-rose-600" onClick={() => setDates(dates.filter((x) => x !== d))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No dates added.</p>
        )}
      </div>

      <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={save}>
        Save Settings
      </button>
    </div>
  );
}
