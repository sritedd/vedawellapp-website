"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2];
type Cell = "empty" | "ship" | "hit" | "miss" | "sunk";

function createGrid(): Cell[][] {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill("empty"));
}

function placeShipsRandomly(): Cell[][] {
    const grid = createGrid();
    for (const len of SHIPS) {
        let placed = false;
        while (!placed) {
            const horiz = Math.random() > 0.5;
            const r = Math.floor(Math.random() * (horiz ? SIZE : SIZE - len));
            const c = Math.floor(Math.random() * (horiz ? SIZE - len : SIZE));
            let ok = true;
            for (let i = 0; i < len && ok; i++) {
                const nr = horiz ? r : r + i, nc = horiz ? c + i : c;
                if (grid[nr][nc] !== "empty") ok = false;
                // Check neighbors
                for (let dr = -1; dr <= 1 && ok; dr++)
                    for (let dc = -1; dc <= 1 && ok; dc++) {
                        const ar = nr + dr, ac = nc + dc;
                        if (ar >= 0 && ar < SIZE && ac >= 0 && ac < SIZE && grid[ar][ac] === "ship") ok = false;
                    }
            }
            if (ok) {
                for (let i = 0; i < len; i++) {
                    grid[horiz ? r : r + i][horiz ? c + i : c] = "ship";
                }
                placed = true;
            }
        }
    }
    return grid;
}

export default function BattleshipGame() {
    const [enemyGrid, setEnemyGrid] = useState<Cell[][]>(() => placeShipsRandomly());
    const [playerGrid, setPlayerGrid] = useState<Cell[][]>(() => placeShipsRandomly());
    const [displayEnemy, setDisplayEnemy] = useState<Cell[][]>(createGrid);
    const [shots, setShots] = useState(0);
    const [enemyShipsLeft, setEnemyShipsLeft] = useState(SHIPS.reduce((a, b) => a + b, 0));
    const [playerShipsLeft, setPlayerShipsLeft] = useState(SHIPS.reduce((a, b) => a + b, 0));
    const [status, setStatus] = useState("Fire at the enemy fleet!");
    const [gameOver, setGameOver] = useState(false);

    const enemyTurn = useCallback((pg: Cell[][]) => {
        const available: [number, number][] = [];
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (pg[r][c] === "empty" || pg[r][c] === "ship") available.push([r, c]);
        if (available.length === 0) return { grid: pg, sunk: 0 };

        const [r, c] = available[Math.floor(Math.random() * available.length)];
        const ng = pg.map(row => [...row]);
        let sunk = 0;
        if (ng[r][c] === "ship") {
            ng[r][c] = "hit";
            sunk = 1;
        } else {
            ng[r][c] = "miss";
        }
        return { grid: ng, sunk };
    }, []);

    const fire = useCallback((r: number, c: number) => {
        if (gameOver) return;
        if (displayEnemy[r][c] === "hit" || displayEnemy[r][c] === "miss") return;

        const ne = displayEnemy.map(row => [...row]);
        let newEnemyLeft = enemyShipsLeft;

        if (enemyGrid[r][c] === "ship") {
            ne[r][c] = "hit";
            newEnemyLeft--;
        } else {
            ne[r][c] = "miss";
        }

        setDisplayEnemy(ne);
        setEnemyShipsLeft(newEnemyLeft);
        setShots(s => s + 1);

        if (newEnemyLeft === 0) {
            setStatus(`You win! 🎉 ${shots + 1} shots fired.`);
            setGameOver(true);
            return;
        }

        // Enemy turn
        const { grid: npg, sunk } = enemyTurn(playerGrid);
        const newPlayerLeft = playerShipsLeft - sunk;
        setPlayerGrid(npg);
        setPlayerShipsLeft(newPlayerLeft);

        if (newPlayerLeft === 0) {
            setStatus("Enemy wins! Your fleet is destroyed.");
            setGameOver(true);
            return;
        }

        setStatus(`Ships remaining — You: ${newPlayerLeft} | Enemy: ${newEnemyLeft}`);
    }, [gameOver, displayEnemy, enemyGrid, enemyShipsLeft, playerGrid, playerShipsLeft, shots, enemyTurn]);

    const resetGame = () => {
        const eg = placeShipsRandomly();
        setEnemyGrid(eg);
        setPlayerGrid(placeShipsRandomly());
        setDisplayEnemy(createGrid());
        setShots(0);
        setEnemyShipsLeft(SHIPS.reduce((a, b) => a + b, 0));
        setPlayerShipsLeft(SHIPS.reduce((a, b) => a + b, 0));
        setStatus("Fire at the enemy fleet!");
        setGameOver(false);
    };

    const cellColor = (cell: Cell, isPlayer: boolean) => {
        if (cell === "hit") return "bg-red-500 border-red-400";
        if (cell === "miss") return "bg-gray-400 border-gray-300";
        if (cell === "ship" && isPlayer) return "bg-gray-600 border-gray-500";
        return "bg-cyan-800 border-cyan-700 hover:bg-cyan-700";
    };

    const renderGrid = (grid: Cell[][], isPlayer: boolean, label: string) => (
        <div>
            <h3 className="text-white font-semibold mb-2 text-center text-sm">{label}</h3>
            <div className="grid grid-cols-10 gap-px bg-cyan-900 p-1 rounded-lg">
                {grid.map((row, r) =>
                    row.map((cell, c) => (
                        <button
                            key={`${r}-${c}`}
                            onClick={!isPlayer ? () => fire(r, c) : undefined}
                            className={`w-6 h-6 md:w-8 md:h-8 border transition-colors rounded-sm
                                ${cellColor(cell, isPlayer)}
                                ${!isPlayer && !gameOver ? "cursor-crosshair" : "cursor-default"}`}
                        >
                            {cell === "hit" ? "💥" : cell === "miss" ? "•" : ""}
                        </button>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl mb-4">
                <Link href="/games" className="text-cyan-200 hover:underline text-sm">← Back to Games</Link>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">🚢 Battleship</h1>
            <p className="text-cyan-200 mb-1 font-semibold">{status}</p>
            <p className="text-cyan-300/60 text-sm mb-4">Shots: {shots}</p>

            <div className="flex flex-col md:flex-row gap-6">
                {renderGrid(displayEnemy, false, "Enemy Waters (click to fire)")}
                {renderGrid(playerGrid, true, "Your Fleet")}
            </div>

            <button onClick={resetGame} className="mt-6 px-8 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-500 transition-colors">
                New Game
            </button>
        </div>
    );
}
