'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface UserData {
  spinsAvailable: number;
  planType: 'monthly' | 'quarterly';
  nextResetTime: number;
}

export default function SpinWheelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const experienceId = params.experienceId as string;
  
  const userId = searchParams.get('user_id') || ('user_' + Math.random().toString(36).slice(2));
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const prizes = [
    { name: 'כישלון 😅', value: 'noWin' },
    { name: 'ספין בונוס 🎁', value: 'bonusSpin' },
    { name: 'גישה 3 ימים 🔓', value: 'threeDay' },
    { name: 'שיעור חינם 📚', value: 'freeLesson' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      if (!experienceId) return;
      
      try {
        setLoading(true);
        const res = await fetch(
          `/api/user?userId=${userId}&experienceId=${experienceId}`
        );
        
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const data = await res.json();
        setUserData(data);
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [experienceId, userId]);

  const spin = async () => {
    if (!userData || userData.spinsAvailable <= 0) {
      setError('אין לך ספינים זמינים');
      return;
    }

    setSpinning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/spins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, experienceId }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        const prizeObj = prizes.find(p => p.value === data.prize);
        const prizeIndex = prizes.findIndex(p => p.value === data.prize);
        
        if (wheelRef.current) {
          const rotation = prizeIndex * 90 + Math.random() * 360;
          wheelRef.current.style.transform = `rotate(${rotation}deg)`;
        }
        
        setResult(prizeObj?.name || data.prize);
        setUserData(prev => prev ? { ...prev, spinsAvailable: data.spinsRemaining } : null);
      }
    } catch (err) {
      setError('Failed to spin - try again');
    } finally {
      setSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4" dir="rtl">
        <div className="text-white text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">🎡 כספת ההטבות</h1>

        {userData && (
          <div className="mb-8 bg-white bg-opacity-20 rounded-lg p-6 text-white">
            <p className="text-2xl font-bold mb-2">✨ {userData.spinsAvailable} ספינים זמינים</p>
            <p className="text-sm opacity-90">
              תוכנית: {userData.planType === 'monthly' ? '📅 חודשית' : '📊 רבעונית'}
            </p>
            <p className="text-xs opacity-75 mt-2">
              איפוס בעוד: {new Date(userData.nextResetTime).toLocaleString('he-IL')}
            </p>
          </div>
        )}

        <div className="mb-12 relative w-72 h-72 mx-auto">
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full transition-transform duration-[2s] ease-out"
            style={{
              boxShadow: '0 0 50px rgba(0,0,0,0.4), inset 0 0 30px rgba(255,255,255,0.1)',
              background: 'conic-gradient(from 0deg, #FFD700 0deg 90deg, #00FF00 90deg 180deg, #FF6B6B 180deg 270deg, #4169E1 270deg 360deg)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            {prizes.map((prize, i) => (
              <div 
                key={i} 
                className="flex items-center justify-center text-white font-bold text-sm drop-shadow-lg"
              >
                <div className="text-center">
                  <div className="text-2xl">{prize.name.split(' ')[1]}</div>
                  <div className="text-xs mt-1">{prize.name.split(' ')[0]}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 w-0 h-0 z-20"
            style={{
              borderLeft: '16px solid transparent',
              borderRight: '16px solid transparent',
              borderTop: '28px solid white',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
          />
          
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-10"
            style={{
              boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        <button
          onClick={spin}
          disabled={spinning || !userData || userData.spinsAvailable <= 0}
          className="px-10 py-4 bg-white text-purple-600 font-bold text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
        >
          {spinning ? '⏳ מסתובב...' : userData && userData.spinsAvailable > 0 ? '🎯 סובב את הגלגל!' : '❌ אין ספינים'}
        </button>

        {result && (
          <div className="mt-8 p-6 bg-white text-purple-600 rounded-lg shadow-xl animate-bounce">
            <p className="text-2xl font-bold">🎉 התוצאה שלך:</p>
            <p className="text-4xl font-bold mt-2">{result}</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-6 bg-red-200 text-red-800 rounded-lg shadow-xl">
            <p className="font-bold">⚠️ {error}</p>
          </div>
        )}

        <div className="mt-8 text-white text-xs opacity-50">
          <p>Experience ID: {experienceId}</p>
          <p>User ID: {userId}</p>
        </div>
      </div>
    </div>
  );
}
