import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { formatDistanceToNow } from '../utils/dateUtils';
import MoodSummary from '../components/MoodSummary';
import EmotionTags from '../components/EmotionTags';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [topEmotions, setTopEmotions] = useState<{tag: string, count: number}[]>([]);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month'>('week');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://trackmymood.onrender.com/api/journal');
        setEntries(response.data);

        // Process data for chart and tags
        processChartData(response.data, timeFrame);
        processEmotionTags(response.data);
      } catch (err) {
        setError('Failed to fetch your journal entries');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  const processChartData = (data: JournalEntry[], period: 'week' | 'month') => {
    if (!data.length) {
      setChartData(null);
      return;
    }

    // Sort entries by date (newest to oldest)
    const sortedEntries = [...data].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Filter entries based on time frame
    const now = new Date();
    const timeLimit = new Date();
    if (period === 'week') {
      timeLimit.setDate(now.getDate() - 7);
    } else {
      timeLimit.setMonth(now.getMonth() - 1);
    }
    
    const filteredEntries = sortedEntries.filter(entry => 
      new Date(entry.createdAt) >= timeLimit
    );
    
    // Group entries by date
    const entriesByDate = filteredEntries.reduce((acc: Record<string, JournalEntry[]>, entry) => {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {});
    
    // Calculate average sentiment score per day
    const dates: string[] = [];
    const sentimentScores: number[] = [];
    
    Object.entries(entriesByDate).forEach(([date, dayEntries]) => {
      const totalScore = dayEntries.reduce((sum, entry) => sum + entry.sentimentScore, 0);
      const avgScore = totalScore / dayEntries.length;
      
      // Format the date
      const [year, month, day] = date.split('-');
      const formattedDate = `${month}/${day}`;
      
      dates.push(formattedDate);
      sentimentScores.push(parseFloat(avgScore.toFixed(2)));
    });
    
    // Reverse arrays to show oldest to newest
    dates.reverse();
    sentimentScores.reverse();
    
    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Mood Score',
          data: sentimentScores,
          borderColor: '#4A90E2',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    });
  };

  const processEmotionTags = (data: JournalEntry[]) => {
    // Count occurrences of each emotion tag
    const emotionCounts: Record<string, number> = {};
    
    data.forEach(entry => {
      entry.tags.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });
    
    // Convert to array and sort by count
    const sortedEmotions = Object.entries(emotionCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Get top 5
    
    setTopEmotions(sortedEmotions);
  };

  const getAverageSentiment = () => {
    if (!entries.length) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.sentimentScore, 0);
    return (total / entries.length).toFixed(1);
  };

  const getMostRecentEntry = () => {
    if (!entries.length) return null;
    return entries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  const recentEntry = getMostRecentEntry();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        min: -5,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <header className="relative">
        <h1 className="text-2xl font-bold text-gray-800">Your Mood Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your emotional well-being over time</p>
        
        <button
          onClick={() => navigate('/journal/new')}
          className="absolute top-0 right-0 btn btn-primary flex items-center space-x-2"
        >
          <PlusCircle size={18} />
          <span>New Entry</span>
        </button>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Average Mood</h3>
              <p className="text-3xl font-bold text-primary-600 mt-2">{getAverageSentiment()}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {entries.length ? `Based on ${entries.length} entries` : 'No entries yet'}
          </p>
        </div>

        <div className="card hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Last Entry</h3>
              <p className="text-lg font-semibold text-gray-800 mt-2">
                {recentEntry 
                  ? formatDistanceToNow(new Date(recentEntry.createdAt)) 
                  : 'No entries yet'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {recentEntry 
              ? `"${recentEntry.title.substring(0, 30)}${recentEntry.title.length > 30 ? '...' : ''}"` 
              : 'Start journaling to see data'}
          </p>
        </div>

        <div className="card hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-700">Entries This Week</h3>
              <p className="text-3xl font-bold text-secondary-600 mt-2">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return entryDate >= weekAgo;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-secondary-100 rounded-full">
              <CalendarDays className="h-6 w-6 text-secondary-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {entries.length ? 'Keep up the good work!' : 'Start journaling to track progress'}
          </p>
        </div>
      </div>

      {/* Mood summary and latest entry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {entries.length > 0 ? (
            <div className="card hover:shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Mood Trends</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setTimeFrame('week')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      timeFrame === 'week' 
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setTimeFrame('month')}
                    className={`px-3 py-1 text-sm rounded-md ${
                      timeFrame === 'month' 
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {chartData ? (
                <div className="h-64">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Not enough data to display mood trends for this time period
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card hover:shadow-md bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-dashed border-primary-200">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="p-3 bg-white rounded-full shadow-sm mb-4">
                  <PlusCircle className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Your Mood Journey</h3>
                <p className="text-gray-600 text-center mb-6">
                  Create your first journal entry to begin tracking your emotional well-being
                </p>
                <button 
                  onClick={() => navigate('/journal/new')}
                  className="btn btn-primary"
                >
                  Create First Entry
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <MoodSummary entries={entries} />
        </div>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover:shadow-md md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Recent Entry</h3>
            {recentEntry && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-lg">{recentEntry.title}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(recentEntry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-4">
                  {recentEntry.content.length > 200 
                    ? `${recentEntry.content.substring(0, 200)}...` 
                    : recentEntry.content}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {recentEntry.tags.emotions.map((tag, i) => (
                    <span key={i} className="tag mood-happy">{tag}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      recentEntry.sentimentScore > 1 ? 'bg-green-500' :
                      recentEntry.sentimentScore > 0 ? 'bg-green-300' :
                      recentEntry.sentimentScore === 0 ? 'bg-blue-300' :
                      recentEntry.sentimentScore > -1 ? 'bg-indigo-300' : 'bg-indigo-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      Mood: {recentEntry.mood}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate(`/journal/edit/${recentEntry._id}`)}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    View full entry
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card hover:shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Top Emotions</h3>
              <CheckCircle2 className="text-secondary-500 h-5 w-5" />
            </div>
            
            <EmotionTags emotions={topEmotions} />
            
            <div className="mt-4">
              <button 
                onClick={() => navigate('/journal/history')}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View all entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;