"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Todo {
    id: string;
    text: string;
    completed: boolean;
    category: string;
    createdAt: Date;
}

const CATEGORIES = [
    { id: "personal", name: "Personal", color: "bg-blue-500" },
    { id: "work", name: "Work", color: "bg-purple-500" },
    { id: "shopping", name: "Shopping", color: "bg-green-500" },
    { id: "health", name: "Health", color: "bg-pink-500" },
];

export default function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("personal");
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("vedawell-todos");
        if (saved) {
            setTodos(JSON.parse(saved).map((t: Todo) => ({
                ...t,
                createdAt: new Date(t.createdAt),
            })));
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("vedawell-todos", JSON.stringify(todos));
    }, [todos]);

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        setTodos([
            ...todos,
            {
                id: Date.now().toString(),
                text: newTodo.trim(),
                completed: false,
                category: selectedCategory,
                createdAt: new Date(),
            },
        ]);
        setNewTodo("");
    };

    const toggleTodo = (id: string) => {
        setTodos(todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const deleteTodo = (id: string) => {
        setTodos(todos.filter((t) => t.id !== id));
    };

    const clearCompleted = () => {
        setTodos(todos.filter((t) => !t.completed));
    };

    const filteredTodos = todos.filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
    });

    const completedCount = todos.filter((t) => t.completed).length;
    const activeCount = todos.length - completedCount;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
            {/* Header */}
            <nav className="border-b border-border bg-white/80 backdrop-blur">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                        <span>🛠️</span>
                        <span>VedaWell Tools</span>
                    </Link>
                    <Link href="/tools" className="text-gray-600 hover:text-gray-900">
                        ← All Tools
                    </Link>
                </div>
            </nav>

            <main className="py-12 px-6">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h1 className="text-3xl font-bold mb-2 text-center">✅ Todo List</h1>
                        <p className="text-gray-500 text-center mb-8">
                            Simple task management ({activeCount} active, {completedCount} done)
                        </p>

                        {/* Add Todo Form */}
                        <form onSubmit={addTodo} className="mb-6">
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    placeholder="Add a new task..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-400 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedCategory === cat.id
                                                ? `${cat.color} text-white`
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </form>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-4">
                            {(["all", "active", "completed"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "text-gray-500 hover:bg-gray-100"
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Todo List */}
                        <div className="space-y-2">
                            {filteredTodos.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    {filter === "all" ? "No tasks yet. Add one above!" : `No ${filter} tasks`}
                                </div>
                            ) : (
                                filteredTodos.map((todo) => {
                                    const cat = CATEGORIES.find((c) => c.id === todo.category);
                                    return (
                                        <div
                                            key={todo.id}
                                            className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${todo.completed ? "bg-gray-50" : "bg-gray-100"
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleTodo(todo.id)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed
                                                        ? "bg-green-500 border-green-500 text-white"
                                                        : "border-gray-300 hover:border-green-500"
                                                    }`}
                                            >
                                                {todo.completed && "✓"}
                                            </button>
                                            <div className="flex-1">
                                                <span
                                                    className={`${todo.completed ? "line-through text-gray-400" : "text-gray-800"
                                                        }`}
                                                >
                                                    {todo.text}
                                                </span>
                                                {cat && (
                                                    <span
                                                        className={`ml-2 px-2 py-0.5 rounded text-xs text-white ${cat.color}`}
                                                    >
                                                        {cat.name}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => deleteTodo(todo.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Actions */}
                        {completedCount > 0 && (
                            <button
                                onClick={clearCompleted}
                                className="mt-4 w-full py-2 text-gray-500 hover:text-red-500 text-sm transition-colors"
                            >
                                Clear {completedCount} completed task{completedCount !== 1 && "s"}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
