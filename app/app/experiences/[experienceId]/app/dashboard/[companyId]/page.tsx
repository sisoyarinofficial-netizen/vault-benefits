'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Win {
  userId: string;
  prize: string;
  timestamp: number;
  redeemed: boolean;
}

interface Settings {
  monthlySpins: number;
  quarterlySpins: number;
  monthlySpinResetHours: number;
}

export default function AdminDashboard() {
  const params = useParams();
  const companyId = params.companyId as string;
  const experienceId = companyId;

  const [wins, setWins] = useState<Win[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Settings>({
    monthlySpins: 2,
    quarterlySpins: 4,
    monthlySpinResetHours: 48,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [winsRes, settingsRes] = await Promise.all([
          fetch(`/api/wins?experienceId=${experienceId}`),
          fetch(`/api/settings?experienceId=${experienceId}`),
        ]);
        const winsData = await winsRes.json();
        const settingsData = await settingsRes.json();
        setWins(winsData);
        setSettings(settingsData);
        setFormData(settingsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    if (experienceId) fetchData();
  }, [experienceId]);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId, ...formData }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setEditMode(false);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const handleUpdateWinStatus = async (userId: string, prize: string, redeemed: boolean) => {
    try {
      await fetch('/api/wins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, experienceId, prize, redeemed: !redeemed }),
      });
      const winsRes = await fetch(`/api/wins?experienceId=${experienceId}`);
      const updatedWins = await winsRes.json();
      setWins(updatedWins);
    } catch (err) {
      console.error('Failed to update win status', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">לוח בקרה מנהל</h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">הגדרות</h2>
          {settings && (
            <>
              {!editMode ? (
                <div className="space-y-2 mb-4">
                  <p><strong>ספינים חודשיים:</strong> {settings.monthlySpins}</p>
                  <p><strong>ספינים רבעוניים:</strong> {settings.quarterlySpins}</p>
                  <p><strong>שעות איפוס:</strong> {settings.monthlySpinResetHours}</p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ערוך
                  </button>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block mb-2">ספינים חודשיים</label>
                    <input
                      type="number"
                      value={formData.monthlySpins}
                      onChange={(e) => setFormData({ ...formData, monthlySpins: parseInt(e.target.value) })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">ספינים רבעוניים</label>
                    <input
                      type="number"
                      value={formData.quarterlySpins}
                      onChange={(e) => setFormData({ ...formData, quarterlySpins: parseInt(e.target.value) })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-2">שעות איפוס</label>
                    <input
                      type="number"
                      value={formData.monthlySpinResetHours}
                      onChange={(e) => setFormData({ ...formData, monthlySpinResetHours: parseInt(e.target.value) })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveSettings} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">שמור</button>
                    <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">בטל</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">טבלת הזוכים</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">משתמש</th>
                  <th className="border p-2">פרס</th>
                  <th className="border p-2">תאריך</th>
                  <th className="border p-2">מנוצל</th>
                  <th className="border p-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {wins.map((win, i) => (
                  <tr key={i} className="border">
                    <td className="border p-2">{win.userId}</td>
                    <td className="border p-2">{win.prize}</td>
                    <td className="border p-2">{new Date(win.timestamp).toLocaleDateString('he-IL')}</td>
                    <td className="border p-2">{win.redeemed ? '✓' : '✗'}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleUpdateWinStatus(win.userId, win.prize, win.redeemed)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        {win.redeemed ? 'סמן כלא מנוצל' : 'סמן כמנוצל'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
