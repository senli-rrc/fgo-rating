
import React, { useState, useEffect } from 'react';
import { Servant, Attribute, User, Rating, Reply, War } from '../types';
import { CLASSES } from '../services/mockData';
import { fetchAtlasData, fetchWarData, transformAtlasData } from '../services/atlasService';
import { dbService } from '../services/dbService';

interface AdminPageProps {
    servants: Servant[];
    onSave: (servant: Servant) => void;
    onDelete: (id: number) => void;
    editingServant?: Servant | null;
    onCancelEdit: () => void;
    onDataSync?: () => void;
    region?: string;
}

type TabType = 'SERVANTS' | 'RANKINGS' | 'QUESTS' | 'USERS';
type ImportMode = 'API' | 'URL' | 'FILE';

const AdminPage: React.FC<AdminPageProps> = ({
    servants,
    onSave,
    onDelete,
    editingServant,
    onCancelEdit,
    onDataSync,
    region = 'JP'
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('SERVANTS');

    // Data for tabs
    const [users, setUsers] = useState<User[]>([]);
    const [ratings, setRatings] = useState<(Rating & { replies: number })[]>([]);
    const [wars, setWars] = useState<War[]>([]);

    // Sync/Import State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [importMode, setImportMode] = useState<ImportMode>('API');
    const [importUrl, setImportUrl] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);

    // Servant Form State
    const initialFormState: Servant = {
        id: 0,
        collectionNo: 0,
        name: '',
        originalName: '',
        type: 'Normal',
        rarity: 1,
        classId: 1,
        className: 'Saber',
        attribute: Attribute.EARTH,
        atkMax: 0,
        hpMax: 0,
        atkBase: 0,
        hpBase: 0,
        cost: 0,
        face: 'https://picsum.photos/200/200',
        images: [],
        cards: ['quick', 'arts', 'buster'],
        traits: []
    };

    const [formData, setFormData] = useState<Servant>(initialFormState);
    const [traitInput, setTraitInput] = useState('');

    // War Edit State
    const [editingWar, setEditingWar] = useState<War | null>(null);

    useEffect(() => {
        // Load data based on tab
        if (activeTab === 'USERS') loadUsers();
        if (activeTab === 'RANKINGS') loadRankings();
        if (activeTab === 'QUESTS') loadWars();
    }, [activeTab]);

    useEffect(() => {
        if (editingServant) {
            setFormData(editingServant);
            setActiveTab('SERVANTS');
        } else {
            const maxId = servants.reduce((max, s) => Math.max(max, s.id), 0);
            setFormData({
                ...initialFormState,
                id: maxId + 1,
                collectionNo: maxId + 1
            });
        }
    }, [editingServant, servants]);

    // Data Loading Functions
    const loadUsers = async () => setUsers(await dbService.getAllUsers());
    const loadWars = async () => {
        let data = await dbService.getAllWars();
        if (data.length === 0) {
            // Auto sync first time
            data = await fetchWarData(region);
            await dbService.bulkUpsertWars(data);
        }
        setWars(data);
    }
    const loadRankings = async () => {
        const allRatings = await dbService.getAllRatings();
        const allReplies = await dbService.getAllReplies();
        const enriched = allRatings.map(r => ({
            ...r,
            replies: allReplies.filter(rp => rp.ratingId === r.id).length
        }));
        setRatings(enriched.sort((a, b) => b.timestamp - a.timestamp));
    }

    // --- Servant Logic ---
    const handleServantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'classId') {
                const selectedClass = CLASSES.find(c => c.id === parseInt(value));
                return {
                    ...prev,
                    classId: parseInt(value),
                    className: selectedClass ? selectedClass.name : prev.className
                }
            }
            const numericFields = ['rarity', 'atkMax', 'hpMax', 'atkBase', 'hpBase', 'cost', 'collectionNo'];
            return {
                ...prev,
                [name]: numericFields.includes(name) ? parseInt(value) : value
            };
        });
    };

    const handleAddTrait = () => {
        if (traitInput.trim() && !formData.traits.includes(traitInput.trim())) {
            setFormData(prev => ({ ...prev, traits: [...prev.traits, traitInput.trim()] }));
            setTraitInput('');
        }
    };

    const handleRemoveTrait = (trait: string) => {
        setFormData(prev => ({ ...prev, traits: prev.traits.filter(t => t !== trait) }));
    };

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cards = e.target.value.split(',').map(c => c.trim().toLowerCase());
        setFormData(prev => ({ ...prev, cards }));
    }

    const handleServantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        if (!editingServant) {
            const maxId = servants.reduce((max, s) => Math.max(max, s.id), 0);
            setFormData({ ...initialFormState, id: maxId + 2, collectionNo: maxId + 2 });
        }
    };

    // Generic processing logic to handle imported data
    const processImportedData = async (data: any[], sourceName: string) => {
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format: Expected an array.");
        }

        setSyncMessage(`Processing ${data.length} records...`);
        let servantsToSave: Servant[] = [];

        // Detection: Check if it's Atlas format (has extraAssets or specific fields) or internal Servant format
        // Atlas format usually has 'className' and 'collectionNo' but also 'extraAssets' or 'skills' with 'functions'
        // Internal format has 'images' array. Atlas has 'extraAssets'.
        const isAtlasFormat = data.length > 0 && (data[0].extraAssets !== undefined || data[0].noblePhantasms?.[0]?.functions !== undefined);

        if (isAtlasFormat) {
            // Use Atlas Transformer
            // Assuming user might want ALL data from a file, passing large limit
            servantsToSave = transformAtlasData(data, region, 2000);
        } else {
            // Assume it's already in Servant format (Backup)
            // Basic validation
            if (data.length > 0 && !data[0].name) throw new Error("Invalid data: Missing name field");
            servantsToSave = data as Servant[];
        }

        setSyncMessage(`Saving ${servantsToSave.length} servants to database...`);
        await dbService.bulkUpsert(servantsToSave);
        setSyncMessage(`Successfully imported ${servantsToSave.length} servants from ${sourceName}!`);
        setTimeout(() => { setIsSyncing(false); if (onDataSync) onDataSync(); }, 1500);
    };

    const handleImport = async () => {
        setIsSyncing(true);
        setSyncMessage('Starting import...');

        try {
            if (importMode === 'API') {
                // This branch is handled by the buttons directly for specific regions, but if generic:
                // Ignored here, existing buttons handle API directly.
                setIsSyncing(false);
                return;
            }

            if (importMode === 'URL') {
                if (!importUrl) throw new Error("Please enter a valid URL");
                setSyncMessage(`Fetching from ${importUrl}...`);
                const res = await fetch(importUrl);
                if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
                const json = await res.json();
                await processImportedData(json, 'URL');
            }

            if (importMode === 'FILE') {
                if (!importFile) throw new Error("Please select a JSON file");
                setSyncMessage(`Reading file ${importFile.name}...`);
                const text = await importFile.text();
                const json = await JSON.parse(text);
                await processImportedData(json, 'File');
            }

        } catch (error: any) {
            console.error(error);
            setSyncMessage(`Error: ${error.message}`);
            setTimeout(() => setIsSyncing(false), 3000);
        }
    };

    const handleAtlasSync = async (targetRegion: string) => {
        if (!confirm(`Fetch data from Atlas Academy (${targetRegion})? This might overwrite existing data.`)) return;
        setIsSyncing(true);
        setSyncMessage(`Connecting to ${targetRegion}...`);
        try {
            const newData = await fetchAtlasData(targetRegion, (msg) => setSyncMessage(msg));
            setSyncMessage(`Saving ${newData.length} records...`);
            await dbService.bulkUpsert(newData);
            setSyncMessage('Done!');
            setTimeout(() => { setIsSyncing(false); if (onDataSync) onDataSync(); }, 1000);
        } catch (error) {
            setSyncMessage('Error during sync.');
            console.error(error);
            setTimeout(() => setIsSyncing(false), 3000);
        }
    };

    // --- User Logic ---
    const toggleUserStatus = async (user: User) => {
        const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        await dbService.saveUser({ ...user, status: newStatus });
        loadUsers();
    };

    // --- War Logic ---
    const handleWarSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWar) return;
        await dbService.saveWar(editingWar);
        setEditingWar(null);
        loadWars();
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20">

            {/* Tabs Header */}
            <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-6 border border-gray-200">
                {(['SERVANTS', 'RANKINGS', 'QUESTS', 'USERS'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-bold rounded-md transition-all ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* SERVANTS TAB */}
            {activeTab === 'SERVANTS' && (
                <div className="space-y-8">
                    {/* Import Section */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Data Import
                        </h3>

                        {/* Import Mode Tabs */}
                        <div className="flex space-x-4 mb-4 border-b border-gray-100 pb-2">
                            <button
                                onClick={() => setImportMode('API')}
                                className={`pb-2 text-sm font-medium ${importMode === 'API' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Official API Sync
                            </button>
                            <button
                                onClick={() => setImportMode('URL')}
                                className={`pb-2 text-sm font-medium ${importMode === 'URL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Import from URL
                            </button>
                            <button
                                onClick={() => setImportMode('FILE')}
                                className={`pb-2 text-sm font-medium ${importMode === 'FILE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Import from File
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* API MODE */}
                            {importMode === 'API' && (
                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                    <span className="text-sm text-gray-600">Sync with Atlas Academy:</span>
                                    <div className="flex gap-2">
                                        {['JP', 'EN', 'CN'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => handleAtlasSync(r)}
                                                disabled={isSyncing}
                                                className="px-4 py-2 bg-gray-100 hover:bg-blue-50 text-blue-700 font-bold rounded border border-gray-300 transition-colors disabled:opacity-50"
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* URL MODE */}
                            {importMode === 'URL' && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={importUrl}
                                        onChange={(e) => setImportUrl(e.target.value)}
                                        placeholder="https://example.com/data.json"
                                        className="flex-grow border rounded px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={handleImport}
                                        disabled={isSyncing || !importUrl}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Fetch & Import
                                    </button>
                                </div>
                            )}

                            {/* FILE MODE */}
                            {importMode === 'FILE' && (
                                <div className="flex flex-col sm:flex-row gap-2 items-center">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                        className="flex-grow border rounded px-3 py-2 text-sm bg-gray-50"
                                    />
                                    <button
                                        onClick={handleImport}
                                        disabled={isSyncing || !importFile}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Upload JSON
                                    </button>
                                </div>
                            )}

                            {isSyncing && <div className="text-sm text-blue-600 animate-pulse font-mono bg-blue-50 p-2 rounded">{syncMessage}</div>}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {editingServant ? 'Edit Servant' : 'Add Manual Entry'}
                            </h2>
                            {editingServant && (
                                <button onClick={onCancelEdit} className="text-gray-500 hover:text-gray-700 underline">
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleServantSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Original Name</label>
                                    <input type="text" name="originalName" value={formData.originalName} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Class</label>
                                    <select name="classId" value={formData.classId} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                                        {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rarity</label>
                                    <input type="number" name="rarity" min="1" max="5" value={formData.rarity} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Collection No</label>
                                    <input type="number" name="collectionNo" value={formData.collectionNo} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max ATK</label>
                                    <input type="number" name="atkMax" value={formData.atkMax} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max HP</label>
                                    <input type="number" name="hpMax" value={formData.hpMax} onChange={handleServantChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Traits</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={traitInput} onChange={(e) => setTraitInput(e.target.value)} className="flex-grow rounded-md border border-gray-300 p-2" placeholder="Add trait..." />
                                        <button type="button" onClick={handleAddTrait} className="bg-indigo-600 text-white px-4 rounded-md">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {formData.traits.map(t => (
                                            <span key={t} className="bg-gray-200 px-2 py-1 rounded text-xs flex items-center">{t} <button type="button" onClick={() => handleRemoveTrait(t)} className="ml-1 text-red-500 font-bold">&times;</button></span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t gap-4">
                                {editingServant && (
                                    <button type="button" onClick={() => { if (confirm('Delete?')) onDelete(formData.id); }} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition-colors">Delete</button>
                                )}
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md font-bold transition-colors">
                                    {editingServant ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RANKINGS (Moderation) TAB */}
            {activeTab === 'RANKINGS' && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">
                        Total Ratings: {ratings.length}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servant ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ratings.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.username} <span className="text-gray-400 text-xs">(ID: {r.userId})</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{r.collectionNo} ({r.server})</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.score}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={r.comment}>{r.comment || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* QUESTS TAB */}
            {activeTab === 'QUESTS' && (
                <div className="space-y-6">
                    {editingWar ? (
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                            <h3 className="font-bold text-xl mb-4">Edit Quest: {editingWar.name}</h3>
                            <form onSubmit={handleWarSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quest Name</label>
                                    <input className="w-full border p-2 rounded" value={editingWar.name} onChange={e => setEditingWar({ ...editingWar, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Long Name</label>
                                    <input className="w-full border p-2 rounded" value={editingWar.longName} onChange={e => setEditingWar({ ...editingWar, longName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Banner URL</label>
                                    <input className="w-full border p-2 rounded" value={editingWar.banner || ''} onChange={e => setEditingWar({ ...editingWar, banner: e.target.value })} />
                                    {editingWar.banner && <img src={editingWar.banner} className="mt-2 h-20 object-cover" alt="Preview" />}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditingWar(null)} className="px-4 py-2 border rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {wars.map(w => (
                                <div key={w.id} className="bg-white border rounded shadow p-4 flex flex-col">
                                    <img src={w.banner} alt="" className="w-full h-24 object-cover mb-2 bg-gray-200 rounded" />
                                    <h4 className="font-bold">{w.name}</h4>
                                    <p className="text-xs text-gray-500 mb-4">{w.longName}</p>
                                    <button
                                        onClick={() => setEditingWar(w)}
                                        className="mt-auto bg-gray-100 hover:bg-gray-200 text-blue-600 px-3 py-1 rounded text-sm font-medium"
                                    >
                                        Edit Content
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'USERS' && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg IP</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">{u.id}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{u.username}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{u.role}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {u.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{u.registerIp || '-'}</td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            {u.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => toggleUserStatus(u)}
                                                    className={`font-medium ${u.status === 'SUSPENDED' ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                                                >
                                                    {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPage;
