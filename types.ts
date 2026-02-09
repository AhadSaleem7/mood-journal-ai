export interface AnalysisResult {
  happiness_score: number;
  dominant_emotion: string;
  summary: string;
  Advice: string;
}

export interface JournalEntryData {
  _id?: string;
  id: string | number; // Support both for optimistic updates
  date: string;
  text: string;
  mood_score: number;
  dominant_emotion: string;
  summary: string;
  Advice: string;
}