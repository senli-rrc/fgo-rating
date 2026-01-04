import React, { useState, useEffect } from 'react';
import { Servant, Attribute, ClassModel } from '../types';
import { CLASSES } from '../services/mockData';
import { fetchAtlasData } from '../services/atlasService';
import { dbService } from '../services/dbService';
import { validateServantData, sanitizeText, validateUrl, ALLOWED_DOMAINS } from '../utils/validation';

interface AdminDashboardProps {
  servants: Servant[];
  onSave: (servant: Servant) => void;
  onDelete: (id: number) => void;
  editingServant?: Servant | null;
  onCancelEdit: () => void;
  onDataSync?: () => void;
  region?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  servants, 
  onSave, 
  onDelete, 
  editingServant, 
  onCancelEdit,
  onDataSync,
  region = 'JP'
}) => {
  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  useEffect(() => {
    if (editingServant) {
      setFormData(editingServant);
    } else {
      const maxId = servants.reduce((max, s) => Math.max(max, s.id), 0);
      setFormData({
        ...initialFormState,
        id: maxId + 1,
        collectionNo: maxId + 1
      });
    }
  }, [editingServant, servants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation errors when user edits
    setValidationErrors([]);
    
    setFormData(prev => {
        if (name === 'classId') {
            const selectedClass = CLASSES.find(c => c.id === parseInt(value));
            return {
                ...prev,
                classId: parseInt(value),
                className: selectedClass ? selectedClass.name : prev.className
            }
        }
        
        // Sanitize text inputs
        if (name === 'name' || name === 'originalName') {
            return {
                ...prev,
                [name]: sanitizeText(value, 200)
            };
        }
        
        // Validate and sanitize URL inputs
        if (name === 'face') {
            return {
                ...prev,
                [name]: value // We'll validate on submit
            };
        }
        
        const numericFields = ['rarity', 'atkMax', 'hpMax', 'atkBase', 'hpBase', 'cost', 'collectionNo'];
        return {
            ...prev,
            [name]: numericFields.includes(name) ? parseInt(value) : value
        };
    });
  };

  const handleAddTrait = () => {
    const sanitized = sanitizeText(traitInput, 100);
    if (sanitized && !formData.traits.includes(sanitized)) {
      setFormData(prev => ({
        ...prev,
        traits: [...prev.traits, sanitized]
      }));
      setTraitInput('');
    }
  };

  const handleRemoveTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.filter(t => t !== trait)
    }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Simple comma separated input for cards for now
      const cards = e.target.value.split(',').map(c => c.trim().toLowerCase());
      setFormData(prev => ({ ...prev, cards }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate servant data
    const validation = validateServantData(formData);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      alert('Please fix validation errors:\n\n' + validation.errors.join('\n'));
      return;
    }
    
    // Additional URL validation for face image
    if (formData.face) {
      const validatedUrl = validateUrl(formData.face);
      if (!validatedUrl) {
        setValidationErrors([
          `Face image URL is invalid or from untrusted domain. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`
        ]);
        alert('Invalid or unsafe face image URL. Please use a URL from an allowed domain.');
        return;
      }
      // Update with validated URL
      formData.face = validatedUrl;
    }
    
    onSave(formData);
    if (!editingServant) {
       const maxId = servants.reduce((max, s) => Math.max(max, s.id), 0); 
       setFormData({ ...initialFormState, id: maxId + 1 + 1, collectionNo: maxId + 1 + 1 });
    }
  };

  const handleAtlasSync = async () => {
    if (!confirm('This will fetch data from Atlas Academy and update your database. This might overwrite existing data. Continue?')) {
        return;
    }
    
    setIsSyncing(true);
    setSyncMessage('Initializing connection...');
    
    try {
        const newData = await fetchAtlasData(region, (msg) => setSyncMessage(msg));
        setSyncMessage(`Saving ${newData.length} records to database...`);
        await dbService.bulkUpsert(newData);
        setSyncMessage('Sync Complete!');
        setTimeout(() => {
            setIsSyncing(false);
            setSyncMessage('');
            if (onDataSync) onDataSync();
        }, 1000);
    } catch (error) {
        setSyncMessage('Error: Failed to sync data.');
        console.error(error);
        setTimeout(() => setIsSyncing(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
      {/* Atlas Integration Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 p-6 rounded-lg shadow-lg text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
                <h3 className="text-xl font-bold brand-font mb-2">External Database Synchronization</h3>
                <p className="text-blue-200 text-sm">Update Spirit Origin List from Atlas Academy Open API ({region}).</p>
            </div>
            <button 
                onClick={handleAtlasSync}
                disabled={isSyncing}
                className={`mt-4 md:mt-0 px-6 py-3 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 flex items-center ${
                    isSyncing ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-400'
                }`}
            >
                {isSyncing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Syncing...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import from API
                    </>
                )}
            </button>
        </div>
        {syncMessage && (
            <div className="mt-4 bg-black/30 p-2 rounded text-sm font-mono text-cyan-300">
                &gt; {syncMessage}
            </div>
        )}
      </div>

      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">
            {editingServant ? 'Edit Servant' : 'Add Manual Entry'}
            </h2>
            {editingServant && (
            <button 
                onClick={onCancelEdit}
                className="text-gray-500 hover:text-gray-700 underline"
            >
                Cancel Edit
            </button>
            )}
        </div>

        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">Validation Errors</h3>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Original Name (JP)</label>
                <input
                type="text"
                name="originalName"
                value={formData.originalName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                >
                {CLASSES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Attribute</label>
                <select
                name="attribute"
                value={formData.attribute}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                >
                {Object.values(Attribute).map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Rarity (1-5)</label>
                <input
                type="number"
                name="rarity"
                min="1"
                max="5"
                value={formData.rarity}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cost</label>
                <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Collection No.</label>
                <input
                type="number"
                name="collectionNo"
                value={formData.collectionNo}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Base ATK</label>
                    <input
                    type="number"
                    name="atkBase"
                    value={formData.atkBase}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max ATK</label>
                    <input
                    type="number"
                    name="atkMax"
                    value={formData.atkMax}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Base HP</label>
                    <input
                    type="number"
                    name="hpBase"
                    value={formData.hpBase}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Max HP</label>
                    <input
                    type="number"
                    name="hpMax"
                    value={formData.hpMax}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Deck (comma separated: quick, arts, buster)</label>
                <input
                type="text"
                name="cards"
                value={formData.cards ? formData.cards.join(',') : ''}
                onChange={handleCardChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                placeholder="quick,arts,arts,buster,buster"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Traits</label>
                <div className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        value={traitInput}
                        onChange={(e) => setTraitInput(e.target.value)}
                        className="flex-grow rounded-md border border-gray-300 p-2 shadow-sm"
                        placeholder="Add a trait..."
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrait())}
                    />
                    <button 
                        type="button" 
                        onClick={handleAddTrait}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.traits.map(t => (
                        <span key={t} className="bg-gray-200 px-2 py-1 rounded-full text-sm flex items-center">
                            {t}
                            <button 
                                type="button"
                                onClick={() => handleRemoveTrait(t)}
                                className="ml-2 text-red-500 font-bold hover:text-red-700"
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                {editingServant && (
                    <button
                    type="button"
                    onClick={() => {
                        if(confirm('Are you sure you want to delete this servant?')) {
                            onDelete(formData.id);
                        }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md shadow mr-auto transition-colors"
                >
                    Delete Servant
                </button>
                )}

            <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md shadow text-lg font-medium transition-colors"
            >
                {editingServant ? 'Update Servant' : 'Create Servant'}
            </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;