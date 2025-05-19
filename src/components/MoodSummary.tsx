import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

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

interface MoodSummaryProps {
  entries: JournalEntry[];
}

const MoodSummary: React.FC<MoodSummaryProps> = ({ entries }) => {
  if (!entries.length) {
    return (
      <div className="card hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Mood Distribution</h3>
        <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Count entries by mood category
  const moodCounts: Record<string, number> = entries.reduce((acc, entry) => {
    const mood = entry.mood;
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array format for chart
  const data = Object.entries(moodCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Colors for different moods
  const COLORS = {
    'Happy': '#50C878',
    'Content': '#82ca9d',
    'Neutral': '#8884d8',
    'Sad': '#8998df',
    'Depressed': '#6970c5',
    'Anxious': '#ffc658',
    'Angry': '#ff8042',
    'Grateful': '#a879e6',
  };

  // Default color for any unspecified mood
  const DEFAULT_COLOR = '#aaa';

  return (
    <div className="card hover:shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Mood Distribution</h3>
      
      {data.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS] || DEFAULT_COLOR}
                  />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-48 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No mood data available</p>
        </div>
      )}
    </div>
  );
};

export default MoodSummary;