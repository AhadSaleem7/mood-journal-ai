import React, { useState } from "react";
import { analyzeJournalEntry } from "../services/geminiService";
import { AnalysisResult, JournalEntryData } from "../types";

interface JournalFormProps {
  onSave: (entry: JournalEntryData) => void;
}

export default function JournalForm({ onSave }: JournalFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null); // Clear previous result while loading

    try {
      // Call the service function
      const analysis = await analyzeJournalEntry(text);

      const entry: JournalEntryData = {
        id: Date.now(), // Temporary ID for optimistic update
        date: new Date().toISOString(),
        text: text,
        mood_score: analysis.happiness_score,
        dominant_emotion: analysis.dominant_emotion,
        summary: analysis.summary,
        Advice: analysis.Advice,
      };

      setResult(analysis);
      onSave(entry);

      // Optional: Clear text after a delay, or keep it so user can see what they wrote vs analysis
      // setText(""); 
    } catch (error) {
      alert("Failed to analyze entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      Joy: "from-yellow-400 to-orange-500",
      Anxiety: "from-purple-400 to-pink-500",
      Burnout: "from-red-500 to-red-700",
      Sadness: "from-blue-400 to-blue-600",
      Anger: "from-red-400 to-red-600",
      Calm: "from-green-400 to-teal-500",
      Excitement: "from-pink-400 to-purple-500",
      Neutral: "from-gray-400 to-gray-600",
    };
    // Basic capitalization fix just in case model returns lowercase
    const normalizedEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase();
    return colors[normalizedEmotion] || colors.Neutral;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="w-full">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>📝</span> How was your day?
        </h2>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write about your day, your feelings, challenges, and victories..."
            className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            disabled={loading}
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-gray-400 text-sm">
              {text.length} characters
            </span>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <span>✨</span> Analyze & Save
                </>
              )}
            </button>
          </div>
        </form>

        {/* Result Display */}
        {result && (
          <div className="mt-6 p-6 bg-black/20 rounded-xl border border-white/10 animate-fade-in">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <span>📊</span> Analysis Result
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5">
                <div className={`text-4xl font-bold ${getScoreColor(result.happiness_score)}`}>
                  {result.happiness_score}
                </div>
                <div className="text-gray-400 text-sm mt-1">Mood Score</div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-center border border-white/5 flex flex-col items-center justify-center">
                <div className={`inline-block px-4 py-1.5 rounded-full bg-gradient-to-r ${getEmotionColor(result.dominant_emotion)} text-white font-medium shadow-sm`}>
                  {result.dominant_emotion}
                </div>
                <div className="text-gray-400 text-sm mt-2">Dominant Emotion</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-gray-300 text-sm italic text-center">
                "{result.summary}"
              </p>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="text-gray-300 text-sm italic text-center">
                "{result.Advice}"
              </p>
            </div>

            <div className="text-green-400 text-sm mt-4 flex items-center gap-2 justify-center font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Entry saved successfully!
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <span>💡</span> Journaling Tips
        </h3>
        <ul className="text-gray-400 text-sm space-y-2 pl-2">
          <li className="flex gap-2"><span>•</span> Be honest about your feelings - this is for you</li>
          <li className="flex gap-2"><span>•</span> Include specific events that affected your mood</li>
          <li className="flex gap-2"><span>•</span> Write about both challenges and positive moments</li>
        </ul>
      </div>
    </div>
  );
}