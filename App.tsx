import React, { useState, useEffect } from "react";
import JournalForm from "./components/JournalForm";
import Auth from "./components/Auth";
import { JournalEntryData } from "./types";
import { StarsBackground } from "./components/animate-ui/components/backgrounds/stars";
import { BubbleBackground } from "./components/animate-ui/components/backgrounds/bubble";

export default function App() {
  const [entries, setEntries] = useState<JournalEntryData[]>([]);
  const [user, setUser] = useState<{ username: string; token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for token
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser({ token, username });
      fetchEntries(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchEntries = async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string, username: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setUser({ token, username });
    fetchEntries(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setEntries([]);
  };

  const handleSave = async (newEntry: JournalEntryData) => {
    if (!user) return;

    // Optimistic update
    const tempId = Date.now().toString(); // Use string ID for consistency
    const optimisticEntry = { ...newEntry, id: tempId };
    setEntries((prev) => [optimisticEntry, ...prev]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newEntry)
      });

      if (res.ok) {
        const savedEntry = await res.json();
        // Replace optimistic entry with real one from DB
        setEntries((prev) => prev.map(e => e.id === tempId ? savedEntry : e));
      } else {
        // Revert on failure
        setEntries((prev) => prev.filter(e => e.id !== tempId));
        alert('Failed to save entry');
      }
    } catch (err) {
      console.error(err);
      setEntries((prev) => prev.filter(e => e.id !== tempId));
      alert('Failed to save entry');
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  if (!user) {
    return (
      <StarsBackground>
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
              Mindful AI Journal
            </h1>
            <p className="text-gray-400">Track your mental well-being with Gemini</p>
          </header>
          <Auth onLogin={handleLogin} />
        </div></StarsBackground>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            Mindful AI Journal
          </h1>
          <p className="text-gray-400">Track your mental well-being with Gemini</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xl text-white font-medium">
            Hi <span className="text-purple-400">{user.username}</span>! 👋
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form */}
        <div>
          <JournalForm onSave={handleSave} />
        </div>

        {/* Right Column: History */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <span>📅</span> Recent Entries
          </h2>

          {entries.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10 border-dashed">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-400">No entries yet. Write your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry._id || entry.id}
                  className="bg-white/5 rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-500 font-mono">
                      {new Date(entry.date).toLocaleDateString()} • {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded bg-white/5 ${entry.mood_score >= 70 ? 'text-green-400' :
                      entry.mood_score >= 40 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                      Score: {entry.mood_score}
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {entry.dominant_emotion}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm line-clamp-2 italic mb-3">
                    "{entry.text}"
                  </p>

                  <div className="pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-400">
                      <span className="text-purple-400">AI Summary:</span> {entry.summary}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-400">
                      <span className="text-purple-400">AI Advice:</span> {entry.Advice}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}