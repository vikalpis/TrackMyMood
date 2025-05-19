import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface JournalFormData {
  title: string;
  content: string;
  tags: {
    emotions: string[];
    people: string[];
    activities: string[];
  };
}

const JournalEntry: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<JournalFormData>({
    title: '',
    content: '',
    tags: {
      emotions: [],
      people: [],
      activities: [],
    }
  });
  
  const [emotionInput, setEmotionInput] = useState('');
  const [personInput, setPersonInput] = useState('');
  const [activityInput, setActivityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    // If editing, fetch the entry data
    if (isEditing) {
      const fetchEntry = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`https://trackmymood.onrender.com/api/journal/${id}`);
          const entry = response.data;
          
          setFormData({
            title: entry.title,
            content: entry.content,
            tags: {
              emotions: entry.tags.emotions || [],
              people: entry.tags.people || [],
              activities: entry.tags.activities || [],
            }
          });
          
          // Set sentiment information
          setSentimentScore(entry.sentimentScore);
          setMood(entry.mood);
        } catch (err) {
          setError('Failed to load journal entry');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchEntry();
    }
  }, [id, isEditing]);

  // Analyze sentiment whenever content changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.content.trim().length > 10) {
        analyzeSentiment(formData.content);
      }
    }, 1000);
    
    return () => clearTimeout(debounceTimer);
  }, [formData.content]);

  const analyzeSentiment = async (text: string) => {
    try {
      const response = await axios.post('https://trackmymood.onrender.com/api/journal/analyze', { text });
      setSentimentScore(response.data.score);
      setMood(response.data.mood);
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      // Don't set error state to avoid interrupting user input
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTag = (type: 'emotions' | 'people' | 'activities', value: string) => {
    if (!value.trim()) return;
    
    // Check if tag already exists
    if (formData.tags[type].includes(value.trim())) return;
    
    setFormData(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [type]: [...prev.tags[type], value.trim()]
      }
    }));
    
    // Clear input
    if (type === 'emotions') setEmotionInput('');
    else if (type === 'people') setPersonInput('');
    else setActivityInput('');
  };

  const removeTag = (type: 'emotions' | 'people' | 'activities', index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: {
        ...prev.tags,
        [type]: prev.tags[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Make sure title and content exist
      if (!formData.title.trim() || !formData.content.trim()) {
        setError('Title and content are required');
        setLoading(false);
        return;
      }
      
      // Analyze sentiment one last time if needed
      if (!sentimentScore) {
        const response = await axios.post('https://trackmymood.onrender.com/api/journal/analyze', { text: formData.content });
        setSentimentScore(response.data.score);
        setMood(response.data.mood);
      }
      
      const journalData = {
        ...formData,
        sentimentScore,
        mood,
      };
      
      let response;
      if (isEditing) {
        response = await axios.put(`https://trackmymood.onrender.com/api/journal/${id}`, journalData);
      } else {
        response = await axios.post('https://trackmymood.onrender.com/api/journal', journalData);
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    
    try {
      setLoading(true);
      await axios.delete(`https://trackmymood.onrender.com/api/journal/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
        </h1>
        
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline flex items-center space-x-2"
          >
            <X size={18} />
            <span>Cancel</span>
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`btn btn-primary flex items-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Save size={18} />
            <span>{loading ? 'Saving...' : 'Save Entry'}</span>
          </button>
          
          {isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 flex items-center space-x-2"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="How was your day?"
            className="input-field mt-1"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Journal Entry
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Write about your day, thoughts, and feelings..."
            className="input-field mt-1 h-64 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emotions
            </label>
            <div className="flex">
              <input
                type="text"
                value={emotionInput}
                onChange={(e) => setEmotionInput(e.target.value)}
                placeholder="Add emotion"
                className="input-field rounded-r-none"
              />
              <button
                type="button"
                onClick={() => addTag('emotions', emotionInput)}
                className="bg-primary-500 text-white px-3 rounded-r-lg hover:bg-primary-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.emotions.map((tag, index) => (
                <div key={index} className="tag bg-primary-100 text-primary-800 flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag('emotions', index)}
                    className="ml-1 text-primary-800 hover:text-primary-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              People
            </label>
            <div className="flex">
              <input
                type="text"
                value={personInput}
                onChange={(e) => setPersonInput(e.target.value)}
                placeholder="Add person"
                className="input-field rounded-r-none"
              />
              <button
                type="button"
                onClick={() => addTag('people', personInput)}
                className="bg-accent-500 text-white px-3 rounded-r-lg hover:bg-accent-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.people.map((tag, index) => (
                <div key={index} className="tag bg-accent-100 text-accent-800 flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag('people', index)}
                    className="ml-1 text-accent-800 hover:text-accent-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activities
            </label>
            <div className="flex">
              <input
                type="text"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                placeholder="Add activity"
                className="input-field rounded-r-none"
              />
              <button
                type="button"
                onClick={() => addTag('activities', activityInput)}
                className="bg-secondary-500 text-white px-3 rounded-r-lg hover:bg-secondary-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.activities.map((tag, index) => (
                <div key={index} className="tag bg-secondary-100 text-secondary-800 flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag('activities', index)}
                    className="ml-1 text-secondary-800 hover:text-secondary-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {sentimentScore !== null && mood && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Sentiment Analysis</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  sentimentScore > 1 ? 'bg-green-500' :
                  sentimentScore > 0 ? 'bg-green-300' :
                  sentimentScore === 0 ? 'bg-blue-300' :
                  sentimentScore > -1 ? 'bg-indigo-300' : 'bg-indigo-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  Detected mood: {mood}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                Score: {sentimentScore.toFixed(2)}
              </div>
              
              <div className="text-xs text-gray-400">
                (Generated automatically based on your entry)
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete this entry?</h3>
            <p className="text-gray-500 mb-6">
              This action cannot be undone. This entry will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntry;