"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  Event as RBCEvent,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";

const locales = {
  "en-US": enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ConsultationEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  status: string;
  videoLink?: string;
}

export default function CalendarView() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<ConsultationEvent[]>([]);
  const [selected, setSelected] = useState<ConsultationEvent | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/consultations?providerId=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const mapped: ConsultationEvent[] = data.map((c: any) => ({
          id: c.id,
          title: c.serviceType,
          start: new Date(c.start),
          end: new Date(c.end),
          status: c.status,
          videoLink: c.videoLink,
        }));
        setEvents(mapped);
      });
  }, [user, token]);

  const eventStyleGetter = useMemo(() => {
    return (_event: ConsultationEvent) => {
      const bg =
        _event.status === "APPROVED"
          ? "#34d399"
          : _event.status === "DECLINED"
          ? "#f87171"
          : _event.status === "COMPLETED"
          ? "#60a5fa"
          : "#fbbf24"; // pending
      return {
        style: {
          backgroundColor: bg,
          borderRadius: "4px",
          color: "#111827",
        },
      };
    };
  }, []);

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        defaultView={Views.MONTH}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(e: any) => setSelected(e as ConsultationEvent)}
      />

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md max-w-sm w-full space-y-4">
            <h3 className="text-lg font-medium">{selected.title}</h3>
            <p>
              {format(selected.start, "PPpp")} - {format(selected.end, "PPpp")}
            </p>
            <p>Status: {selected.status}</p>
            {selected.videoLink && (
              <a
                href={selected.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 underline"
              >
                Join video call
              </a>
            )}
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={() => handleUpdate("APPROVED")}>Approve</button>
              <button className="px-3 py-1 bg-rose-600 text-white rounded" onClick={() => handleUpdate("DECLINED")}>Decline</button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => handleReschedule()}>Reschedule</button>
            </div>
            <button className="absolute top-2 right-3 text-xl" onClick={() => setSelected(null)}>
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function handleUpdate(status: string) {
    fetch(`${API_BASE_URL}/consultations/${selected!.id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, status: updated.status, videoLink: updated.videoLink } : e)));
        setSelected(null);
      });
  }

  function handleReschedule() {
    const newDateStr = prompt("Enter new date YYYY-MM-DD", format(selected!.start, "yyyy-MM-dd"));
    const newTimeStr = prompt("Enter new time HH:mm", format(selected!.start, "HH:mm"));
    if (!newDateStr || !newTimeStr) return;
    const startISO = `${newDateStr}T${newTimeStr}:00`;
    const endISO = new Date(new Date(startISO).getTime() + 30 * 60000).toISOString();
    fetch(`${API_BASE_URL}/consultations/${selected!.id}/reschedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ start: startISO, end: endISO }),
    })
      .then((r) => r.json())
      .then((updated) => {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === updated.id
              ? { ...e, start: new Date(updated.start), end: new Date(updated.end), status: updated.status }
              : e
          )
        );
        setSelected(null);
      });
  }
}
