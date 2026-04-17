// Local storage for Al-Khal voice notes
export interface VoiceNote {
  id: string;
  createdAt: number;
  durationSec: number;
  audioDataUrl: string; // base64 webm/mp4
  transcript?: string;
  summary?: string[];
  reminders?: { text: string; when: string }[];
}

const KEY = "zoolkaarb-voice-notes";

export const loadNotes = (): VoiceNote[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VoiceNote[]) : [];
  } catch {
    return [];
  }
};

export const saveNotes = (notes: VoiceNote[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Failed saving notes", e);
  }
};

export const upsertNote = (note: VoiceNote) => {
  const all = loadNotes();
  const idx = all.findIndex((n) => n.id === note.id);
  if (idx >= 0) all[idx] = note;
  else all.unshift(note);
  saveNotes(all.slice(0, 50)); // keep last 50
};

export const deleteNote = (id: string) => {
  saveNotes(loadNotes().filter((n) => n.id !== id));
};
