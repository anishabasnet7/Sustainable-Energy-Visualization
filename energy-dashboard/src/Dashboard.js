import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    Papa.parse("/processed_data.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        setData(results.data);
      },
    });
  }, []);

  if (!data.length) return <p>Loading data...</p>;

  // filter data for a specific country
  const countryData = data.filter((d) => d.country === "India");

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Energy Trends for India</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={countryData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="access_to_electricity" stroke="#8884d8" />
          <Line type="monotone" dataKey="renewable_energy_consumption_percentage" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
