"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Card { id: string; front: string; back: string; }
interface Deck { id: string; name: string; cards: Card[]; }

export default function FlashcardApp() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [currentDeck, setCurrentDeck] = useState<Deck | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [newDeckName, setNewDeckName] = useState("");
    const [newCard, setNewCard] = useState({ front: "", back: "" });
    const [showAdd, setShowAdd] = useState(false);

    useEffect(() => { const saved = localStorage.getItem("flashcards"); if (saved) setDecks(JSON.parse(saved)); }, []);
    useEffect(() => { localStorage.setItem("flashcards", JSON.stringify(decks)); }, [decks]);

    const addDeck = () => { if (!newDeckName.trim()) return; setDecks([...decks, { id: Date.now().toString(), name: newDeckName, cards: [] }]); setNewDeckName(""); };
    const deleteDeck = (id: string) => { setDecks(decks.filter(d => d.id !== id)); if (currentDeck?.id === id) setCurrentDeck(null); };
    const addCard = () => { if (!newCard.front.trim() || !newCard.back.trim() || !currentDeck) return; const updated = decks.map(d => d.id === currentDeck.id ? { ...d, cards: [...d.cards, { id: Date.now().toString(), ...newCard }] } : d); setDecks(updated); setCurrentDeck({ ...currentDeck, cards: [...currentDeck.cards, { id: Date.now().toString(), ...newCard }] }); setNewCard({ front: "", back: "" }); setShowAdd(false); };
    const next = () => { if (!currentDeck) return; setIsFlipped(false); setCurrentIndex((currentIndex + 1) % currentDeck.cards.length); };
    const prev = () => { if (!currentDeck) return; setIsFlipped(false); setCurrentIndex((currentIndex - 1 + currentDeck.cards.length) % currentDeck.cards.length); };

    if (!currentDeck) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-slate-900 to-slate-900">
                <nav className="border-b border-yellow-800/50 bg-slate-900/80 backdrop-blur">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <Link href="/tools" className="text-yellow-400 hover:text-white">← Back</Link>
                        <h1 className="text-xl font-bold text-white">📚 Flashcard App</h1>
                    </div>
                </nav>
                <main className="max-w-4xl mx-auto p-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-yellow-800/30 mb-6">
                        <div className="flex gap-2">
                            <input type="text" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="New deck name" className="flex-1 px-4 py-2 bg-slate-900 border border-yellow-700 rounded-lg text-white" />
                            <button onClick={addDeck} className="px-4 py-2 bg-yellow-600 text-white rounded-lg">Create Deck</button>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {decks.map(deck => (
                            <div key={deck.id} onClick={() => { setCurrentDeck(deck); setCurrentIndex(0); setIsFlipped(false); }} className="bg-slate-800/50 rounded-xl p-6 border border-yellow-800/30 cursor-pointer hover:bg-slate-700/50">
                                <div className="flex justify-between items-start">
                                    <div><div className="text-xl font-bold text-white">{deck.name}</div><div className="text-slate-400">{deck.cards.length} cards</div></div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }} className="text-red-400 hover:text-red-300">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {decks.length === 0 && <div className="text-center text-slate-500 py-12">Create your first deck to get started</div>}
                </main>
            </div>
        );
    }

    const currentCard = currentDeck.cards[currentIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-slate-900 to-slate-900">
            <nav className="border-b border-yellow-800/50 bg-slate-900/80 backdrop-blur">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button onClick={() => setCurrentDeck(null)} className="text-yellow-400 hover:text-white">← {currentDeck.name}</button>
                    <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm">+ Add Card</button>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-6 text-center">
                {currentCard ? (
                    <>
                        <div className="text-slate-400 mb-4">{currentIndex + 1} / {currentDeck.cards.length}</div>
                        <div onClick={() => setIsFlipped(!isFlipped)} className="bg-slate-800/50 rounded-2xl p-8 border border-yellow-800/30 min-h-[300px] flex items-center justify-center cursor-pointer hover:bg-slate-700/50 transition-all">
                            <div className="text-2xl text-white">{isFlipped ? currentCard.back : currentCard.front}</div>
                        </div>
                        <div className="text-sm text-slate-500 mt-2">Click to flip</div>
                        <div className="flex gap-4 justify-center mt-6">
                            <button onClick={prev} className="px-6 py-3 bg-slate-700 text-white rounded-xl">← Prev</button>
                            <button onClick={next} className="px-6 py-3 bg-yellow-600 text-white rounded-xl">Next →</button>
                        </div>
                    </>
                ) : (
                    <div className="text-slate-500 py-12">No cards yet. Add some cards to start studying!</div>
                )}
            </main>
            {showAdd && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-yellow-800">
                        <h3 className="text-xl font-bold text-white mb-4">Add Card</h3>
                        <input type="text" value={newCard.front} onChange={(e) => setNewCard({ ...newCard, front: e.target.value })} placeholder="Front (question)" className="w-full px-4 py-2 bg-slate-900 border border-yellow-700 rounded-lg text-white mb-3" />
                        <input type="text" value={newCard.back} onChange={(e) => setNewCard({ ...newCard, back: e.target.value })} placeholder="Back (answer)" className="w-full px-4 py-2 bg-slate-900 border border-yellow-700 rounded-lg text-white mb-4" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg">Cancel</button>
                            <button onClick={addCard} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg">Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
