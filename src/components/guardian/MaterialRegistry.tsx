"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/guardian/Toast";

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

export default function MaterialRegistry({ projectId }: MaterialRegistryProps) {
    const { toast } = useToast();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchMaterials();
    }, [projectId]);

    const fetchMaterials = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("materials")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

        if (data) {
            setMaterials(data.map((m: Record<string, unknown>) => ({
                id: m.id as string,
                category: (m.category as string) || "",
                name: (m.name as string) || "",
                brand: (m.brand as string) || "",
                model: (m.model as string) || "",
                color: (m.color as string) || "",
                supplier: (m.supplier as string) || "",
                location: (m.location as string) || "",
                verified: (m.verified as boolean) || false,
                notes: (m.notes as string) || "",
            })));
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        const { error } = await supabase.from("materials").insert({
            project_id: projectId,
            category: formData.category,
            name: formData.name,
            brand: formData.brand,
            model: formData.model,
            color: formData.color,
            supplier: formData.supplier,
            location: formData.location,
            verified: formData.verified,
            notes: formData.notes,
        });

        if (!error) {
            setShowForm(false);
            setFormData({
                category: "flooring", name: "", brand: "", model: "",
                color: "", supplier: "", location: "", verified: false, notes: "",
            });
            fetchMaterials();
        }
    };

    const toggleVerified = async (id: string, current: boolean) => {
        const supabase = createClient();
        const { error } = await supabase.from("materials").update({ verified: !current }).eq("id", id);
        if (error) { toast("Failed to update. Please try again.", "error"); return; }
        setMaterials(materials.map((m) => m.id === id ? { ...m, verified: !current } : m));
    };

    const deleteMaterial = async (id: string) => {
        const supabase = createClient();
        const { error } = await supabase.from("materials").delete().eq("id", id);
        if (error) { toast("Failed to delete. Please try again.", "error"); return; }
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Material Specifications</h2>
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
            {materials.length > 0 && (
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
                            style={{ width: `${materials.length > 0 ? (verifiedCount / materials.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!selectedCategory ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
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
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${selectedCategory === cat.id ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}
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
                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Material Name</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Bathroom Floor Tile" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Brand</label>
                            <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Dulux" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Model/Product</label>
                            <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Wash & Wear Low Sheen" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Color/Finish</label>
                            <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Lexicon Quarter" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Supplier</label>
                            <input type="text" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Bunnings Warehouse" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Location/Usage</label>
                            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-3 border border-border rounded-lg" placeholder="e.g., Master bedroom, Living room" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Notes</label>
                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border border-border rounded-lg resize-none h-20" placeholder="Any special instructions or notes..." />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
                        Add Material
                    </button>
                </form>
            )}

            {/* Materials List */}
            <div className="space-y-3">
                {filteredMaterials.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        {materials.length === 0
                            ? "No materials added yet. Add your first material specification."
                            : "No materials match your search."}
                    </div>
                ) : (
                    filteredMaterials.map((material) => {
                        const cat = CATEGORIES.find((c) => c.id === material.category);
                        return (
                            <div key={material.id} className={`p-4 bg-card border rounded-xl ${material.verified ? "border-green-300" : "border-border"}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{cat?.icon}</span>
                                            <span className="font-medium">{material.name}</span>
                                            {material.verified && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Verified</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-2">
                                            {material.brand}{material.model ? ` - ${material.model}` : ""}{material.color ? ` | ${material.color}` : ""}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {material.location && `Location: ${material.location}`}{material.supplier ? ` | Supplier: ${material.supplier}` : ""}
                                        </div>
                                        {material.notes && (
                                            <div className="text-xs text-amber-600 mt-2">{material.notes}</div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleVerified(material.id, material.verified)} className={`px-3 py-1 rounded text-sm ${material.verified ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                                            {material.verified ? "Unverify" : "Verify"}
                                        </button>
                                        <button onClick={() => deleteMaterial(material.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
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
                <p className="font-medium mb-1">Why Track Materials?</p>
                <p>
                    Documenting material specifications helps prevent substitutions and ensures
                    your builder uses exactly what was agreed upon. Always verify materials
                    match your contract before installation.
                </p>
            </div>
        </div>
    );
}
