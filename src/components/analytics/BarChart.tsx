import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

interface BarChartProps {
  total?: number;
  percentageIncrease?: number;
  description?: string;
  titles?: string[];
  data?: { x: string; y: number }[][];
}

const BarChart: React.FC<BarChartProps> = ({
  total = 7564,
  percentageIncrease = 7,
  description = "New products this week",
  titles = ["Digital", "Goods"],
  data = [
    [
      { x: "01 Feb", y: 170 },
      { x: "02 Feb", y: 180 },
      { x: "03 Feb", y: 164 },
      { x: "04 Feb", y: 145 },
      { x: "05 Feb", y: 174 },
      { x: "06 Feb", y: 170 },
      { x: "07 Feb", y: 155 },
    ],
    [
      { x: "01 Feb", y: 120 },
      { x: "02 Feb", y: 134 },
      { x: "03 Feb", y: 167 },
      { x: "04 Feb", y: 179 },
      { x: "05 Feb", y: 145 },
      { x: "06 Feb", y: 182 },
      { x: "07 Feb", y: 143 },
    ],
  ],
}) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const colorPalette = [
    "#1D4ED8", // Base Blue (Primary)
    "#93C5FD", // Light Blue Tint
    "#2563EB", // Slightly Brighter Blue
    "#172554", // Deep Navy
    "#FACC15", // Complementary Golden Yellow
    "#F43F5E", // Vibrant Red Accent
    "#14B8A6", // Teal for contrast
    "#64748B", // Muted Blue-Gray
    "#0F172A", // Very Dark Blue
    "#E5E7EB", // Soft Gray for balance
  ];

  // Chart configuration
  const getBarChartOptions = () => ({
    series: data.map((series, index) => ({
      name: titles[index],
      color: colorPalette[index],
      data: series.map((item) => item.y),
    })),
    chart: {
      type: "bar",
      height: "316px",
      fontFamily: "Inter, sans-serif",
      foreColor: "#4B5563",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "80%",
        borderRadius: 3,
        borderRadiusApplication: "top",
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: {
        fontSize: "14px",
        fontFamily: "Inter, sans-serif",
      },
    },
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 1,
        },
      },
    },
    stroke: {
      show: true,
      width: 5,
      colors: ["transparent"],
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      floating: true,
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: false,
    },
    fill: {
      opacity: 1,
    },
  });

  // Initialize chart state
  useEffect(() => {
    setChartOptions(getBarChartOptions());

    const rerenderChart = () => {
      setChartOptions(getBarChartOptions());
    };

    // Listen for theme changes
    document.addEventListener("rerender-charts", rerenderChart);
    return () => {
      document.removeEventListener("rerender-charts", rerenderChart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 md:p-6 w-full">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold leading-none text-gray-900 dark:text-white">
            {total.toLocaleString()}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <span className="flex items-center font-semibold text-green-500 dark:text-green-400">
          <svg
            className="h-5 w-5 text-green-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v13m0-13 4 4m-4-4-4 4"></path>
          </svg>
          {percentageIncrease}%
        </span>
      </div>

      {/* Bar Chart */}
      <div className="py-6">
        {chartOptions && (
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="bar"
            height={350}
          />
        )}
      </div>
    </div>
  );
};

export default BarChart;
