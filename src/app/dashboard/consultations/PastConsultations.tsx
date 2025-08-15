"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

interface Item {
  id: number;
  start: string;
  end: string;
  buyer: { firstName?: string; lastName?: string; name?: string };
  feedback?: { rating: number; comment?: string } | null;
}

export default function PastConsultations() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/consultations/history?providerId=${user.id}`)
      .then((r) => r.json())
      .then(setItems);
  }, [user]);

  function submitFeedback() {
    if (!selectedId) return;
    fetch(`${API_BASE_URL}/consultations/${selectedId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating, comment }),
    })
      .then((r) => r.json())
      .then((fb) => {
        setItems((prev) =>
          prev.map((it) => (it.id === selectedId ? { ...it, feedback: fb } : it))
        );
        setSelectedId(null);
      });
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">Past Consultations</h2>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-slate-100">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Buyer</th>
            <th className="border px-2 py-1">Feedback</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="px-2 py-1">{new Date(c.start).toLocaleString()}</td>
              <td className="px-2 py-1">{c.buyer.firstName ?? c.buyer.name ?? '—'}</td>
              <td className="px-2 py-1">
                {c.feedback ? (
                  <span>{c.feedback.rating}/5</span>
                ) : (
                  <button
                    className="text-sky-600 underline"
                    onClick={() => setSelectedId(c.id)}
                  >
                    Add Feedback
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-80 space-y-2">
            <h3 className="font-medium">Feedback</h3>
            <label className="block">Rating (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="border w-full px-2 py-1"
            />
            <label className="block">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border w-full px-2 py-1"
            />
            <div className="text-right space-x-2">
              <button className="px-3 py-1" onClick={() => setSelectedId(null)}>
                Cancel
              </button>
              <button className="px-3 py-1 bg-emerald-600 text-white" onClick={submitFeedback}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
