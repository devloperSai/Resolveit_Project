// src/components/shared/AdminAnalytics.tsx
import React, { useMemo } from 'react';
import { Complaint, Officer } from '../../types';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '../ui/chart';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  Sector,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target, Activity, BarChart3, Users } from 'lucide-react';


// Helper: safely convert submittedAt (string or Date) -> Date
const toDate = (d: string | Date | undefined): Date => {
  if (!d) return new Date();
  return d instanceof Date ? d : new Date(d);
};

// Custom Active Shape for Enhanced Pie Chart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-xl font-bold">
        {value}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#64748b" className="text-sm">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={35} textAnchor="middle" fill="#94a3b8" className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border-2 border-primary/20 rounded-xl shadow-2xl p-4 animate-fade-in">
        <p className="font-semibold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface AdminAnalyticsProps {
  complaints: Complaint[];
  officers: Officer[];
  getOfficerWorkload: (email: string) => { assigned: number; inProgress: number; completed: number };
}
export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  complaints,
  officers,
  getOfficerWorkload,
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  // Status Distribution Data - Enhanced with radial data
// Status Distribution Data - Enhanced with radial data
const statusData = useMemo(() => {
  const statusCounts = {
    pending: complaints.filter(c => 
      c.status?.toLowerCase() === 'pending'
    ).length,
    assigned: complaints.filter(c => 
      c.status?.toLowerCase() === 'assigned'
    ).length,
    'in-progress': complaints.filter(c => 
      c.status?.toLowerCase() === 'in-progress' || c.status?.toLowerCase() === 'in_progress'
    ).length,
    resolved: complaints.filter(c => 
      c.status?.toLowerCase() === 'resolved'
    ).length,
  };
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
  return [
    {
      name: 'Pending',
      value: statusCounts.pending,
      fill: 'hsl(38, 92%, 50%)',
      percentage: ((statusCounts.pending / total) * 100).toFixed(1)
    },
    {
      name: 'Assigned',
      value: statusCounts.assigned,
      fill: 'hsl(217, 91%, 60%)',
      percentage: ((statusCounts.assigned / total) * 100).toFixed(1)
    },
    {
      name: 'In Progress',
      value: statusCounts['in-progress'],
      fill: 'hsl(189, 94%, 43%)',
      percentage: ((statusCounts['in-progress'] / total) * 100).toFixed(1)
    },
    {
      name: 'Resolved',
      value: statusCounts.resolved,
      fill: 'hsl(142, 71%, 45%)',
      percentage: ((statusCounts.resolved / total) * 100).toFixed(1)
    },
  ];
}, [complaints]);
  // Radial Bar Chart Data for Status
  const radialStatusData = useMemo(() => {
    return statusData.map((item, index) => ({
      ...item,
      fill: item.fill,
      uv: item.value,
    }));
  }, [statusData]);
  // Category Distribution Data
  const categoryData = useMemo(() => {
    const categoryCounts: { [key: string]: number } = {};
    complaints.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [complaints]);
// Priority Distribution Data
const priorityData = useMemo(() => {
  return [
    {
      name: 'Low',
      value: complaints.filter(c => 
        c.priority?.toLowerCase() === 'low'
      ).length,
      fill: 'hsl(142, 71%, 45%)'
    },
    {
      name: 'Medium',
      value: complaints.filter(c => 
        c.priority?.toLowerCase() === 'medium'
      ).length,
      fill: 'hsl(38, 92%, 50%)'
    },
    {
      name: 'High',
      value: complaints.filter(c => 
        c.priority?.toLowerCase() === 'high'
      ).length,
      fill: 'hsl(0, 72%, 51%)'
    },
  ];
}, [complaints]);
// Timeline Data (Last 7 days)
const timelineData = useMemo(() => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });
  return last7Days.map(date => {
    const dayComplaints = complaints.filter(c =>
      toDate(c.submittedAt).toISOString().split('T')[0] === date
    );

    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submitted: dayComplaints.length,
      resolved: dayComplaints.filter(c => 
        c.status?.toLowerCase() === 'resolved'
      ).length,
      pending: dayComplaints.filter(c => 
        c.status?.toLowerCase() === 'pending'
      ).length,
    };
  });
}, [complaints]);
  // Officer Workload Data
  const officerWorkloadData = useMemo(() => {
    return officers.slice(0, 5).map(officer => {
      const workload = getOfficerWorkload(officer.email);
      return {
        name: officer.name.split(' ')[0],
        assigned: workload.assigned,
        inProgress: workload.inProgress,
        completed: workload.completed,
      };
    });
  }, [officers, getOfficerWorkload]);
// Calculate metrics
const metrics = useMemo(() => {
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => 
    c.status?.toLowerCase() === 'resolved'
  ).length;
  const resolutionRate = totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : '0.0';

  const last7DaysComplaints = complaints.filter(c => {
    const daysDiff = Math.floor((Date.now() - toDate(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  }).length;
  const prev7DaysComplaints = complaints.filter(c => {
    const daysDiff = Math.floor((Date.now() - toDate(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7 && daysDiff <= 14;
  }).length;
  const trend = prev7DaysComplaints > 0
    ? (((last7DaysComplaints - prev7DaysComplaints) / prev7DaysComplaints) * 100).toFixed(1)
    : '0';
  return { resolutionRate, trend: Number(trend), last7DaysComplaints };
}, [complaints]);
  const chartConfig = {
    pending: { label: 'Pending', color: 'hsl(38, 92%, 50%)' },
    assigned: { label: 'Assigned', color: 'hsl(217, 91%, 60%)' },
    inProgress: { label: 'In Progress', color: 'hsl(189, 94%, 43%)' },
    resolved: { label: 'Resolved', color: 'hsl(142, 71%, 45%)' },
    completed: { label: 'Completed', color: 'hsl(142, 71%, 45%)' },
  };
  return (
    <div className="space-y-6 mb-8">
      {/* Key Metrics Cards - Enhanced with gradients and animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Resolution Rate</span>
              <div className="bg-green-500 p-2.5 rounded-xl shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {metrics.resolutionRate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${metrics.resolutionRate}%` }}
                ></div>
              </div>
              <span className="text-xs text-green-700 font-semibold">Target: 85%</span>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-2 border-blue-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Weekly Trend</span>
              <div className={`p-2.5 rounded-xl shadow-lg ${metrics.trend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                {metrics.trend >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-white" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {metrics.last7DaysComplaints}
              </span>
              <span className={`text-lg font-bold px-2.5 py-1 rounded-lg ${
                metrics.trend >= 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {metrics.trend >= 0 ? '+' : ''}{metrics.trend}%
              </span>
            </div>
            <span className="text-xs text-slate-600 font-medium">complaints this week</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border-2 border-purple-200/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Avg. Response Time</span>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-2.5 rounded-xl shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                2.4
              </span>
              <span className="text-lg text-slate-600 font-semibold">hours</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-purple-700 font-semibold">12% faster than last week</span>
            </div>
          </div>
        </div>
      </div>
      {/* Charts Grid - Enhanced with advanced effects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Status Distribution with Active Shape */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Status Distribution</h3>
                <p className="text-sm text-slate-500">Interactive overview of complaint status</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {statusData.map((entry, index) => (
                      <filter key={`shadow-${index}`} id={`shadow-${index}`} height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="0" dy="4" result="offsetblur"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3"/>
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        filter={`url(#shadow-${index})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {statusData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer"
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div
                    className="w-3 h-3 rounded-full shadow-lg"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs font-medium text-slate-700">{item.name}</span>
                  <span className="text-xs font-bold text-slate-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Radial Bar Chart for Priority */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute top-0 left-0 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Priority Levels</h3>
                <p className="text-sm text-slate-500">Radial distribution by urgency</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="20%"
                  outerRadius="90%"
                  data={priorityData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <defs>
                    <filter id="glow" height="300%" width="300%" x="-75%" y="-75%">
                      <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="thicken" />
                      <feGaussianBlur in="thicken" stdDeviation="5" result="blurred" />
                      <feFlood floodColor="rgb(59, 130, 246)" floodOpacity="0.5" result="glowColor" />
                      <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow" />
                      <feMerge>
                        <feMergeNode in="softGlow"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <RadialBar
                    background={{ fill: '#f1f5f9' }}
                    dataKey="value"
                    cornerRadius={10}
                    filter="url(#glow)"
                  />
                  <Legend
                    iconSize={12}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    content={({ payload }) => (
                      <div className="space-y-2">
                        {payload?.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200/50 shadow-sm">
                            <div
                              className="w-3 h-3 rounded-full shadow-md"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-semibold text-slate-700">{entry.value}</span>
                            <span className="text-xs font-bold text-slate-900 ml-auto">
                              {priorityData[index]?.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
        {/* Gradient Bar Chart for Categories */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Top Categories</h3>
                <p className="text-sm text-slate-500">Most reported complaint types</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={1}/>
                      <stop offset="100%" stopColor="hsl(189, 94%, 43%)" stopOpacity={1}/>
                    </linearGradient>
                    <filter id="barShadow" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                      <feOffset dx="0" dy="4" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(214.3, 31.8%, 91.4%)"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(215.4, 16.3%, 46.9%)', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                    axisLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(215.4, 16.3%, 46.9%)', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="url(#colorBar)"
                    radius={[12, 12, 0, 0]}
                    filter="url(#barShadow)"
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
        {/* Enhanced Timeline with Gradient Area */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border-2 border-slate-200/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">7-Day Performance</h3>
                <p className="text-sm text-slate-500">Submission vs Resolution trend</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.9}/>
                      <stop offset="50%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.9}/>
                      <stop offset="50%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="areaShadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3"/>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(214.3, 31.8%, 91.4%)"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(215.4, 16.3%, 46.9%)', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(215.4, 16.3%, 46.9%)', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="submitted"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSubmitted)"
                    name="Submitted"
                    filter="url(#areaShadow)"
                    animationDuration={1500}
                    dot={{ r: 4, fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'hsl(217, 91%, 60%)', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                    name="Resolved"
                    filter="url(#areaShadow)"
                    animationDuration={1500}
                    dot={{ r: 4, fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'hsl(142, 71%, 45%)', strokeWidth: 3, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
      {/* Officer Workload - Full Width with Advanced Effects */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200/50 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-cyan-400/10 to-green-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Officer Workload Distribution</h3>
              <p className="text-sm text-slate-500">Balanced assignment tracking across team members</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 p-4 rounded-2xl shadow-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerWorkloadData} barGap={8}>
                <defs>
                  <linearGradient id="assignedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="hsl(217, 91%, 70%)" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(189, 94%, 43%)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="hsl(189, 94%, 55%)" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="hsl(142, 71%, 55%)" stopOpacity={0.8}/>
                  </linearGradient>
                  <filter id="workloadShadow" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="3" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(214.3, 31.8%, 91.4%)"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(215.4, 16.3%, 46.9%)', fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)', strokeWidth: 2 }}
                  tickLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(215.4, 16.3%, 46.9%)', fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)', strokeWidth: 2 }}
                  tickLine={{ stroke: 'hsl(214.3, 31.8%, 91.4%)' }}
                  label={{ value: 'Tasks Count', angle: -90, position: 'insideLeft', fill: 'hsl(215.4, 16.3%, 46.9%)', fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => <span className="font-semibold text-slate-700">{value}</span>}
                />
                <Bar
                  dataKey="assigned"
                  fill="url(#assignedGradient)"
                  radius={[10, 10, 0, 0]}
                  name="Assigned"
                  filter="url(#workloadShadow)"
                  animationDuration={1200}
                />
                <Bar
                  dataKey="inProgress"
                  fill="url(#progressGradient)"
                  radius={[10, 10, 0, 0]}
                  name="In Progress"
                  filter="url(#workloadShadow)"
                  animationDuration={1200}
                />
                <Bar
                  dataKey="completed"
                  fill="url(#completedGradient)"
                  radius={[10, 10, 0, 0]}
                  name="Completed"
                  filter="url(#workloadShadow)"
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    
    </div>
  );
};

export default AdminAnalytics;
