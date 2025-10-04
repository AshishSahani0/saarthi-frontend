import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line as LineChart, Bar as BarChart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export default function AssessmentCharts({ assessments }) {
  const [maxPoints, setMaxPoints] = useState(10);

  useEffect(() => {
    const updateMaxPoints = () => {
      const width = window.innerWidth;
      if (width < 640) setMaxPoints(5);
      else if (width < 1024) setMaxPoints(7);
      else setMaxPoints(10);
    };

    updateMaxPoints();
    window.addEventListener("resize", updateMaxPoints);
    return () => window.removeEventListener("resize", updateMaxPoints);
  }, []);

  if (!assessments || assessments.length === 0) return <p className="text-center p-4">No assessments yet</p>;

  const recentAssessments = assessments.slice(-maxPoints);
  const labels = recentAssessments.map(a =>
    new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  );
  const phq = recentAssessments.map(a => a.phqScore);
  const gad = recentAssessments.map(a => a.gadScore);
  const ghq = recentAssessments.map(a => a.ghqScore);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    interaction: { mode: "nearest", intersect: false },
    animation: {
      duration: 800,
      easing: "easeInOutQuad",
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 30,
        title: { display: true, text: "Score" },
      },
      x: {
        title: { display: true, text: "Date" },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    animation: {
      duration: 800,
      easing: "easeInOutQuad",
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 30,
        title: { display: true, text: "Score" },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Line Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow h-[400px] sm:h-[450px]">
        <h2 className="font-bold mb-4 text-lg sm:text-xl text-center sm:text-left">
          Mental Health Over Time ({recentAssessments.length} Assessments)
        </h2>
        <div className="w-full h-full">
          <LineChart
            data={{
              labels,
              datasets: [
                {
                  label: "PHQ-9",
                  data: phq,
                  borderColor: "rgba(255, 99, 132, 1)",
                  backgroundColor: "rgba(255, 99, 132, 0.2)",
                  fill: true,
                  tension: 0.3,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
                {
                  label: "GAD-7",
                  data: gad,
                  borderColor: "rgba(54, 162, 235, 1)",
                  backgroundColor: "rgba(54, 162, 235, 0.2)",
                  fill: true,
                  tension: 0.3,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
                {
                  label: "GHQ",
                  data: ghq,
                  borderColor: "rgba(75, 192, 192, 1)",
                  backgroundColor: "rgba(75, 192, 192, 0.2)",
                  fill: true,
                  tension: 0.3,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={lineOptions}
          />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow h-[400px] sm:h-[450px]">
        <h2 className="font-bold mb-4 text-lg sm:text-xl text-center sm:text-left">Latest Scores</h2>
        <div className="w-full h-full">
          <BarChart
            data={{
              labels: ["PHQ-9", "GAD-7", "GHQ"],
              datasets: [
                {
                  label: "Latest Score",
                  data: [
                    assessments.at(-1)?.phqScore || 0,
                    assessments.at(-1)?.gadScore || 0,
                    assessments.at(-1)?.ghqScore || 0,
                  ],
                  backgroundColor: [
                    "rgba(255,99,132,0.7)",
                    "rgba(54,162,235,0.7)",
                    "rgba(75,192,192,0.7)",
                  ],
                  borderColor: [
                    "rgba(255,99,132,1)",
                    "rgba(54,162,235,1)",
                    "rgba(75,192,192,1)",
                  ],
                  borderWidth: 1,
                  borderRadius: 6,
                },
              ],
            }}
            options={barOptions}
          />
        </div>
      </div>
    </div>
  );
}
