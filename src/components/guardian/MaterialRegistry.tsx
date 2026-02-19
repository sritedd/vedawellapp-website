"use client";

import { useState } from "react";

interface Material {
    id: string;
    category: string;
    name: string;
    brand: string;
    model: string;
    color: string;
    supplier: string;
    location: string;
    verified: boolean;
    notes: string;
}

interface MaterialRegistryProps {
    projectId: string;
}

const CATEGORIES = [
    { id: "flooring", name: "Flooring", icon: "🪵" },
    { id: "tiles", name: "Tiles", icon: "🪟" },
    { id: "paint", name: "Paint", icon: "🎨" },
    { id: "fixtures", name: "Fixtures", icon: "🚿" },
    { id: "appliances", name: "Appliances", icon: "🍳" },
    { id: "windows", name: "Windows & Doors", icon: "🚪" },
    { id: "roofing", name: "Roofing", icon: "🏠" },
    { id: "lighting", name: "Lighting", icon: "💡" },
    { id: "hardware", name: "Hardware", icon: "🔧" },
];

const INITIAL_MATERIALS: Material[] = [
    {
        id: "1",
        category: "flooring",
        name: "Engineered Oak Flooring",
        brand: "Quick-Step",
        model: "Palazzo Natural Heritage Oak",
        color: "Natural Oak",
        supplier: "Harvey Norman",
        location: "Living, Dining, Bedrooms",
        verified: true,
        notes: "Ensure 5% wastage allowance ordered",
    },
    {
        id: "2",
        category: "tiles",
        name: "Bathroom Floor Tile",
        brand: "Beaumont Tiles",
        model: "Portland Grey 600x600",
        color: "Grey",
        supplier: "Beaumont Tiles Homebush",
        location: "Bathroom 1, Bathroom 2, Ensuite",
        verified: true,
        notes: "",
    },
    {
        id: "3",
        category: "paint",
        name: "Internal Wall Paint",
        brand: "Dulux",
        model: "Wash & Wear",
        color: "Lexicon Quarter",
        supplier: "Bunnings",
        location: "All internal walls",
        verified: false,
        notes: "Confirm colour matches sample",
    },
];

export default function MaterialRegistry({ projectId }: MaterialRegistryProps) {
    const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState<Partial<Material>>({
        category: "flooring",
        name: "",
        brand: "",
        model: "",
        color: "",
        supplier: "",
        location: "",
        verified: false,
        notes: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newMaterial: Material = {
            ...formData as Material,
            id: Date.now().toString(),
        };
        setMaterials([...materials, newMaterial]);
        setShowForm(false);
        setFormData({
            category: "flooring",
            name: "",
            brand: "",
            model: "",
            color: "",
            supplier: "",
            location: "",
            verified: false,
            notes: "",
        });
    };

    const toggleVerified = (id: string) => {
        setMaterials(
            materials.map((m) =>
                m.id === id ? { ...m, verified: !m.verified } : m
            )
        );
    };

    const deleteMaterial = (id: string) => {
        setMaterials(materials.filter((m) => m.id !== id));
    };

    const filteredMaterials = materials.filter((m) => {
        const matchesCategory = !selectedCategory || m.category === selectedCategory;
        const matchesSearch =
            !searchQuery ||
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.brand.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const verifiedCount = materials.filter((m) => m.verified).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">📋 Material Specifications</h2>
                    <p className="text-muted-foreground">
                        Track all materials specified for your build.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    {showForm ? "Cancel" : "+ Add Material"}
                </button>
            </div>

            {/* Progress */}
            <div className="p-4 bg-card border border-border rounded-xl">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Verification Progress</span>
                    <span className="text-sm text-muted-foreground">
                        {verifiedCount}/{materials.length} verified
                    </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(verifiedCount / materials.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!selectedCategory ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
                        }`}
                >
                    All ({materials.length})
                </button>
                {CATEGORIES.map((cat) => {
                    const count = materials.filter((m) => m.category === cat.id).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === cat.id
                                    ? "bg-primary text-white"
                                    : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            {cat.icon} {cat.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="w-full p-3 border border-border rounded-lg"
            />

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <h3 className="font-bold">Add New Material</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Material Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Bathroom Floor Tile"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Brand</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Dulux"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Model/Product</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Wash & Wear Low Sheen"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Color/Finish</label>
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Lexicon Quarter"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Supplier</label>
                            <input
                                type="text"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Bunnings Warehouse"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Location/Usage</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg"
                                placeholder="e.g., Master bedroom, Living room"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full p-3 border border-border rounded-lg resize-none h-20"
                                placeholder="Any special instructions or notes..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                    >
                        Add Material
                    </button>
                </form>
            )}

            {/* Materials List */}
            <div className="space-y-3">
                {filteredMaterials.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No materials found. Add your first material specification!
                    </div>
                ) : (
                    filteredMaterials.map((material) => {
                        const cat = CATEGORIES.find((c) => c.id === material.category);
                        return (
                            <div
                                key={material.id}
                                className={`p-4 bg-card border rounded-xl ${material.verified ? "border-green-300" : "border-border"
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{cat?.icon}</span>
                                            <span className="font-medium">{material.name}</span>
                                            {material.verified && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-2">
                                            {material.brand} - {material.model} | {material.color}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            📍 {material.location} | 🏪 {material.supplier}
                                        </div>
                                        {material.notes && (
                                            <div className="text-xs text-amber-600 mt-2">
                                                📝 {material.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleVerified(material.id)}
                                            className={`px-3 py-1 rounded text-sm ${material.verified
                                                    ? "bg-gray-100 text-gray-600"
                                                    : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {material.verified ? "Unverify" : "Verify"}
                                        </button>
                                        <button
                                            onClick={() => deleteMaterial(material.id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Tip */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Why Track Materials?</p>
                <p>
                    Documenting material specifications helps prevent substitutions and ensures
                    your builder uses exactly what was agreed upon. Always verify materials
                    match your contract before installation.
                </p>
            </div>
        </div>
    );
}
