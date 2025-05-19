import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, PlusCircle, Calendar } from 'lucide-react';
import axios from 'axios';

interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  sentimentScore: number;
  mood: string;
  tags: {
    emotions: string[];
    people: string[];
    activities: string[];
  };
  createdAt: string;
}

const JournalHistory: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: '',
    end: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://trackmymood.onrender.com/api/journal');
        // Sort entries by date (newest first)
        const sortedEntries = response.data.sort((a: JournalEntry, b: JournalEntry) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEntries(sortedEntries);
        setFilteredEntries(sortedEntries);
      } catch (err) {
        setError('Failed to fetch journal entries');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let results = [...entries];

    // Search term
    if (searchTerm) {
      results = results.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by mood
    if (selectedMood) {
      results = results.filter(entry => entry.mood === selectedMood);
    }

    // Filter by tag (across all tag categories)
    if (selectedTag) {
      results = results.filter(entry => 
        entry.tags.emotions.includes(selectedTag) ||
        entry.tags.people.includes(selectedTag) ||
        entry.tags.activities.includes(selectedTag)
      );
    }

    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      results = results.filter(entry => new Date(entry.createdAt) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59); // End of the day
      results = results.filter(entry => new Date(entry.createdAt) <= endDate);
    }

    setFilteredEntries(results);
  }, [entries, searchTerm, selectedMood, selectedTag, dateRange]);

  // Get unique moods for filtering
  const moodOptions = [...new Set(entries.map(entry => entry.mood))].filter(Boolean);

  // Get unique tags across all categories
  const allTags = entries.reduce((tags, entry) => {
    return [
      ...tags,
      ...entry.tags.emotions,
      ...entry.tags.people,
      ...entry.tags.activities
    ];
  }, [] as string[]);
  
  const tagOptions = [...new Set(allTags)].filter(Boolean);

  // Group entries by month
  const entriesByMonth: Record<string, JournalEntry[]> = filteredEntries.reduce((groups, entry) => {
    const date = new Date(entry.createdAt);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(entry);
    return groups;
  }, {} as Record<string, JournalEntry[]>);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedMood('');
    setSelectedTag('');
    setDateRange({ start: '', end: '' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-16 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Journal History</h1>
        
        <div className="w-full md:w-auto">
          <button
            onClick={() => navigate('/journal/new')}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusCircle size={18} />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filters and search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Mood filter */}
          <div>
            <label htmlFor="mood-filter" className="sr-only">Filter by mood</label>
            <div className="relative">
              <select
                id="mood-filter"
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                <option value="">All moods</option>
                {moodOptions.map(mood => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tag filter */}
          <div>
            <label htmlFor="tag-filter" className="sr-only">Filter by tag</label>
            <div className="relative">
              <select
                id="tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="input-field appearance-none pr-10"
              >
                <option value="">All tags</option>
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Date filter */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="date-start" className="sr-only">Start date</label>
              <div className="relative">
                <input
                  type="date"
                  id="date-start"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input-field pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="date-end" className="sr-only">End date</label>
              <div className="relative">
                <input
                  type="date"
                  id="date-end"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="input-field pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clear filters button */}
        {(searchTerm || selectedMood || selectedTag || dateRange.start || dateRange.end) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No journal entries found</h3>
          <p className="text-gray-500 mb-6">
            {entries.length === 0 
              ? "You haven't created any journal entries yet." 
              : "No entries match your search filters."}
          </p>
          {entries.length === 0 && (
            <button
              onClick={() => navigate('/journal/new')}
              className="btn btn-primary"
            >
              Create your first entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(entriesByMonth).map(([month, monthEntries]) => (
            <div key={month} className="animate-slide-up">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{month}</h2>
              <div className="space-y-4">
                {monthEntries.map(entry => (
                  <div 
                    key={entry._id}
                    onClick={() => navigate(`/journal/edit/${entry._id}`)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-800">{entry.title}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {entry.content}
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.emotions.length > 0 && (
                          <span className="tag mood-happy">
                            {entry.tags.emotions[0]}
                            {entry.tags.emotions.length > 1 && ` +${entry.tags.emotions.length - 1}`}
                          </span>
                        )}
                        
                        {entry.tags.people.length > 0 && (
                          <span className="tag bg-accent-100 text-accent-800">
                            {entry.tags.people[0]}
                            {entry.tags.people.length > 1 && ` +${entry.tags.people.length - 1}`}
                          </span>
                        )}
                        
                        {entry.tags.activities.length > 0 && (
                          <span className="tag bg-secondary-100 text-secondary-800">
                            {entry.tags.activities[0]}
                            {entry.tags.activities.length > 1 && ` +${entry.tags.activities.length - 1}`}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          entry.sentimentScore > 1 ? 'bg-green-500' :
                          entry.sentimentScore > 0 ? 'bg-green-300' :
                          entry.sentimentScore === 0 ? 'bg-blue-300' :
                          entry.sentimentScore > -1 ? 'bg-indigo-300' : 'bg-indigo-500'
                        }`}></div>
                        <span className="text-sm text-gray-600">{entry.mood}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalHistory;