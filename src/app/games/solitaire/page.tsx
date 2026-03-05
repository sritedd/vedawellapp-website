"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Suit = "♠" | "♥" | "♦" | "♣";
type Card = { suit: Suit; rank: number; faceUp: boolean; };
type Column = Card[];

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANK_NAMES = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const isRed = (s: Suit) => s === "♥" || s === "♦";

function makeDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS)
        for (let rank = 1; rank <= 13; rank++)
            deck.push({ suit, rank, faceUp: false });
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function initGame() {
    const deck = makeDeck();
    const columns: Column[] = Array.from({ length: 7 }, () => []);
    let idx = 0;
    for (let c = 0; c < 7; c++) {
        for (let r = 0; r <= c; r++) {
            columns[c].push({ ...deck[idx], faceUp: r === c });
            idx++;
        }
    }
    const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
    return { columns, stock, waste: [] as Card[], foundations: [[], [], [], []] as Card[][] };
}

export default function SolitaireGame() {
    const [game, setGame] = useState(initGame);
    const [selected, setSelected] = useState<{ from: string; colIdx?: number; cardIdx?: number } | null>(null);
    const [moves, setMoves] = useState(0);

    const canPlace = (card: Card, target: Card | null, isFoundation: boolean): boolean => {
        if (isFoundation) {
            if (!target) return card.rank === 1;
            return card.suit === target.suit && card.rank === target.rank + 1;
        } else {
            if (!target) return card.rank === 13;
            return isRed(card.suit) !== isRed(target.suit) && card.rank === target.rank - 1;
        }
    };

    const drawCard = useCallback(() => {
        setGame(g => {
            const ng = { ...g, stock: [...g.stock], waste: [...g.waste] };
            if (ng.stock.length === 0) {
                ng.stock = ng.waste.reverse().map(c => ({ ...c, faceUp: false }));
                ng.waste = [];
            } else {
                const card = ng.stock.pop()!;
                card.faceUp = true;
                ng.waste.push(card);
            }
            return ng;
        });
        setSelected(null);
    }, []);

    const handleClick = useCallback((from: string, colIdx?: number, cardIdx?: number) => {
        if (!selected) {
            setSelected({ from, colIdx, cardIdx });
            return;
        }

        setGame(g => {
            const ng = {
                columns: g.columns.map(c => c.map(card => ({ ...card }))),
                stock: [...g.stock],
                waste: g.waste.map(c => ({ ...c })),
                foundations: g.foundations.map(f => f.map(c => ({ ...c }))),
            };

            let cardsToMove: Card[] = [];

            // Get cards from source
            if (selected.from === "waste" && ng.waste.length > 0) {
                cardsToMove = [ng.waste[ng.waste.length - 1]];
            } else if (selected.from === "column" && selected.colIdx !== undefined && selected.cardIdx !== undefined) {
                const col = ng.columns[selected.colIdx];
                if (selected.cardIdx < col.length && col[selected.cardIdx].faceUp) {
                    cardsToMove = col.slice(selected.cardIdx);
                }
            } else if (selected.from === "foundation" && selected.colIdx !== undefined) {
                const f = ng.foundations[selected.colIdx];
                if (f.length > 0) cardsToMove = [f[f.length - 1]];
            }

            if (cardsToMove.length === 0) {
                setSelected(from === selected.from && colIdx === selected.colIdx ? null : { from, colIdx, cardIdx });
                return g;
            }

            let placed = false;

            if (from === "foundation" && colIdx !== undefined && cardsToMove.length === 1) {
                const f = ng.foundations[colIdx];
                const top = f.length > 0 ? f[f.length - 1] : null;
                if (canPlace(cardsToMove[0], top, true)) {
                    f.push(cardsToMove[0]);
                    placed = true;
                }
            } else if (from === "column" && colIdx !== undefined) {
                const col = ng.columns[colIdx];
                const top = col.length > 0 ? col[col.length - 1] : null;
                if (canPlace(cardsToMove[0], top, false)) {
                    col.push(...cardsToMove);
                    placed = true;
                }
            }

            if (placed) {
                // Remove from source
                if (selected.from === "waste") {
                    ng.waste.pop();
                } else if (selected.from === "column" && selected.colIdx !== undefined && selected.cardIdx !== undefined) {
                    ng.columns[selected.colIdx] = ng.columns[selected.colIdx].slice(0, selected.cardIdx);
                    const col = ng.columns[selected.colIdx];
                    if (col.length > 0 && !col[col.length - 1].faceUp) {
                        col[col.length - 1].faceUp = true;
                    }
                } else if (selected.from === "foundation" && selected.colIdx !== undefined) {
                    ng.foundations[selected.colIdx].pop();
                }
                setMoves(m => m + 1);
                setSelected(null);
                return ng;
            }

            setSelected({ from, colIdx, cardIdx });
            return g;
        });
    }, [selected]);

    const isWon = game.foundations.every(f => f.length === 13);

    const renderCard = (card: Card | null, isSelected: boolean, onClick: () => void) => {
        if (!card) return (
            <div onClick={onClick} className="w-14 h-20 md:w-16 md:h-22 rounded-lg border-2 border-dashed border-gray-500/30 cursor-pointer" />
        );
        if (!card.faceUp) return (
            <div onClick={onClick} className="w-14 h-20 md:w-16 md:h-22 rounded-lg bg-blue-700 border-2 border-blue-500 shadow cursor-pointer hover:brightness-110" />
        );
        return (
            <div
                onClick={onClick}
                className={`w-14 h-20 md:w-16 md:h-22 rounded-lg bg-white border-2 shadow cursor-pointer flex flex-col justify-between p-1 text-sm font-bold
                    ${isSelected ? "border-yellow-400 ring-2 ring-yellow-400" : "border-gray-300"}
                    ${isRed(card.suit) ? "text-red-600" : "text-gray-900"}
                    hover:brightness-95`}
            >
                <span>{RANK_NAMES[card.rank]}{card.suit}</span>
                <span className="self-end rotate-180">{RANK_NAMES[card.rank]}{card.suit}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 flex flex-col items-center p-4">
            <div className="w-full max-w-3xl mb-3">
                <Link href="/games" className="text-green-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-3xl font-bold text-white mb-1">♠ Solitaire</h1>
            <div className="flex gap-4 mb-3 text-green-200 text-sm">
                <span>Moves: {moves}</span>
                {isWon && <span className="text-yellow-400 font-bold">🎉 You Win!</span>}
            </div>

            {/* Top row: stock, waste, foundations */}
            <div className="flex gap-2 mb-4 items-start">
                {/* Stock */}
                <div onClick={drawCard} className="cursor-pointer">
                    {game.stock.length > 0
                        ? <div className="w-14 h-20 md:w-16 md:h-22 rounded-lg bg-blue-700 border-2 border-blue-500 shadow hover:brightness-110 flex items-center justify-center text-white font-bold">{game.stock.length}</div>
                        : <div className="w-14 h-20 md:w-16 md:h-22 rounded-lg border-2 border-dashed border-gray-400/30 flex items-center justify-center text-green-400/50">↺</div>
                    }
                </div>
                {/* Waste */}
                <div>
                    {game.waste.length > 0
                        ? renderCard(game.waste[game.waste.length - 1], selected?.from === "waste", () => handleClick("waste"))
                        : <div className="w-14 h-20 md:w-16 md:h-22 rounded-lg border-2 border-dashed border-gray-500/20" />
                    }
                </div>
                <div className="w-6" />
                {/* Foundations */}
                {game.foundations.map((f, i) => (
                    <div key={i}>
                        {f.length > 0
                            ? renderCard(f[f.length - 1], selected?.from === "foundation" && selected?.colIdx === i, () => handleClick("foundation", i))
                            : <div onClick={() => handleClick("foundation", i)} className="w-14 h-20 md:w-16 md:h-22 rounded-lg border-2 border-dashed border-yellow-500/30 flex items-center justify-center text-yellow-500/40 text-xl cursor-pointer">{SUITS[i]}</div>
                        }
                    </div>
                ))}
            </div>

            {/* Columns */}
            <div className="flex gap-2 items-start">
                {game.columns.map((col, ci) => (
                    <div key={ci} className="flex flex-col" style={{ minHeight: 200 }}>
                        {col.length === 0 && (
                            <div onClick={() => handleClick("column", ci)} className="w-14 h-20 md:w-16 md:h-22 rounded-lg border-2 border-dashed border-gray-500/20 cursor-pointer" />
                        )}
                        {col.map((card, ri) => (
                            <div key={ri} style={{ marginTop: ri > 0 ? (card.faceUp ? -50 : -60) : 0, zIndex: ri }}>
                                {renderCard(card, selected?.from === "column" && selected?.colIdx === ci && selected?.cardIdx === ri,
                                    () => card.faceUp ? handleClick("column", ci, ri) : undefined)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <button onClick={() => { setGame(initGame()); setMoves(0); setSelected(null); }} className="mt-4 px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 transition-colors">
                New Game
            </button>
        </div>
    );
}
