import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register the necessary modules for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VariableGraphProps {
  data: { time: number; value: number }[];
  label: string;
}

const VariableGraph: React.FC<VariableGraphProps> = ({ data, label }) => {
  const chartData = {
    labels: data.map((point) => point.time.toString()), // x-axis labels
    datasets: [
      {
        label,
        data: data.map((point) => point.value), // y-axis values
        fill: false,
        borderColor: "blue",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Variable History",
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default VariableGraph;
