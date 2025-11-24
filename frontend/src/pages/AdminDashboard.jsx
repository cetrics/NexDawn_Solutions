import React, { useEffect, useState } from "react";
import {
  FaWallet,
  FaShoppingCart,
  FaPiggyBank,
  FaChartPie,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "react-toastify";
import { useDateRange } from "./DateRangeContext";
import "./css/Main.css";

const Dashboard = () => {
  const { dateRange, setDateRange } = useDateRange();
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    savings: 0,
    recent_activity: [],
  });
  const [chartData, setChartData] = useState([]);

  // ✅ Fetch dashboard summary
  const fetchSummary = async () => {
    try {
      const query = new URLSearchParams({
        from: dateRange.startDate,
        to: dateRange.endDate,
      }).toString();

      const res = await fetch(`/api/dashboard-summary?${query}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        toast.error("Failed to load dashboard summary");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while loading summary");
    }
  };

  // ✅ Fetch monthly chart data
  const fetchChart = async () => {
    try {
      const query = new URLSearchParams({
        from: dateRange.startDate,
        to: dateRange.endDate,
      }).toString();

      const res = await fetch(`/api/dashboard-chart?${query}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
      } else {
        toast.error("Failed to load chart data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while loading chart data");
    }
  };

  // ✅ Auto-load data whenever date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchSummary();
      fetchChart();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  return (
    <div>
      {/* 🔹 Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <FaChartPie className="header-icon-dashboard" />
          <h1>Dashboard</h1>
        </div>
      </header>

      {/* 🔹 Date Range Filter */}
      <div className="date-filter">
        <label>From:</label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: e.target.value })
          }
        />
        <label>To:</label>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: e.target.value })
          }
        />
      </div>

      {/* 🔹 Summary Cards */}
      <section className="summary-cards">
        <div className="card">
          <FaWallet className="card-icon income" />
          <div>
            <p>Total Income</p>
            <h3>KSh {summary.total_income.toLocaleString()}</h3>
          </div>
        </div>

        <div className="card">
          <FaShoppingCart className="card-icon expense" />
          <div>
            <p>Total Expenses</p>
            <h3>KSh {summary.total_expenses.toLocaleString()}</h3>
          </div>
        </div>

        <div className="card">
          <FaPiggyBank className="card-icon savings" />
          <div>
            <p>Savings</p>
            <h3>KSh {summary.savings.toLocaleString()}</h3>
          </div>
        </div>
      </section>

      {/* 🔹 Chart + Recent Activity */}
      <section className="main-grid">
        <div className="chart-section">
          <h2>Monthly Overview</h2>
          <div className="chart-placeholder">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total_income"
                  fill="#8b5cf6"
                  name="Income"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="total_expenses"
                  fill="#ec4899"
                  name="Expenses"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="activity-section">
          <h2>Recent Activity</h2>
          <ul>
            {summary.recent_activity.length > 0 ? (
              summary.recent_activity.map((item, index) => (
                <li key={index}>
                  🧾{" "}
                  {item.category_name
                    ? `${item.category_name}: `
                    : `${item.item}: `}
                  <strong>KSh {Number(item.amount).toLocaleString()}</strong>{" "}
                  <em>({item.type})</em>
                </li>
              ))
            ) : (
              <li>No recent activity</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
