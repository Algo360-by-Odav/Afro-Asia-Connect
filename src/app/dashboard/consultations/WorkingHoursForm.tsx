"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

interface Entry {
  weekday: number;
  startTime: string;
  endTime: string;
}

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WorkingHoursForm() {
  const { user, token } = useAuth();
  const [entries, setEntries] = useState<Entry[]>(() =>
    Array.from({ length: 7 }, (_, i) => ({ weekday: i, startTime: "09:00", endTime: "17:00" }))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/providers/${user.id}/working-hours`)
      .then((r) => r.json())
      .then((data) => {
        if (data.length) setEntries(data);
      });
  }, [user]);

  function handleChange(idx: number, field: "startTime" | "endTime", value: string) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }

  function save() {
    setSaving(true);
    fetch(`${API_BASE_URL}/providers/${user!.id}/working-hours`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ entries }),
    })
      .then(() => alert("Working hours saved"))
      .finally(() => setSaving(false));
  }

  return (
    <div className="space-y-4">
      {entries.map((e, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          <span className="w-12">{weekdayNames[e.weekday]}</span>
          <input
            type="time"
            className="border px-2 py-1"
            value={e.startTime}
            onChange={(ev) => handleChange(idx, "startTime", ev.target.value)}
          />
          <span>-</span>
          <input
            type="time"
            className="border px-2 py-1"
            value={e.endTime}
            onChange={(ev) => handleChange(idx, "endTime", ev.target.value)}
          />
        </div>
      ))}
      <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
