"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Note { id: string; title: string; content: string; updatedAt: string; }

export default function NotesApp() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => { const saved = localStorage.getItem("notes"); if (saved) setNotes(JSON.parse(saved)); }, []);
    useEffect(() => { localStorage.setItem("notes", JSON.stringify(notes)); }, [notes]);

    const selectedNote = notes.find(n => n.id === selected);
    const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

    const addNote = () => { const note: Note = { id: Date.now().toString(), title: "Untitled", content: "", updatedAt: new Date().toISOString() }; setNotes([note, ...notes]); setSelected(note.id); };
    const updateNote = (id: string, updates: Partial<Note>) => { setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n)); };
    const deleteNote = (id: string) => { setNotes(notes.filter(n => n.id !== id)); if (selected === id) setSelected(null); };

    return (
        <div className="min-h-screen bg-slate-900 flex">
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <Link href="/tools" className="text-slate-400 hover:text-white text-sm">← Back</Link>
                    <button onClick={addNote} className="text-2xl text-yellow-400 hover:text-yellow-300">+</button>
                </div>
                <div className="p-2"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm" /></div>
                <div className="flex-1 overflow-y-auto">
                    {filtered.map(note => (
                        <div key={note.id} onClick={() => setSelected(note.id)} className={`p-3 cursor-pointer border-b border-slate-700 ${selected === note.id ? "bg-yellow-900/30" : "hover:bg-slate-700"}`}>
                            <div className="text-white font-medium truncate">{note.title || "Untitled"}</div>
                            <div className="text-slate-400 text-xs truncate">{note.content.slice(0, 50) || "No content"}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col">
                {selectedNote ? (
                    <>
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <input type="text" value={selectedNote.title} onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })} className="text-xl font-bold bg-transparent text-white border-none focus:outline-none" placeholder="Title" />
                            <button onClick={() => deleteNote(selectedNote.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                        </div>
                        <textarea value={selectedNote.content} onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })} className="flex-1 p-4 bg-transparent text-white resize-none focus:outline-none" placeholder="Start writing..." />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">Select or create a note</div>
                )}
            </div>
        </div>
    );
}
