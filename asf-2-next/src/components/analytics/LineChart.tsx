import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

interface SalesChartProps {
  dateRange?: string;
  redirectUrl?: string;
  redirectText?: string;
  chartData?: { data: number[]; name: string}[];
  titleData?: { title: string; value: number, unit?:string  }[];
  categories?: string[];
}

const LineChart: React.FC<SalesChartProps> = ({
  dateRange = "Dec 31 - Jan 31",
  redirectUrl,
  redirectText = "Sales Report",
  chartData = [
    {
      series: [12000, 15000, 18000, 22000, 29000, 35000, 40000, 45000, 47867],
      name: "Sales",
    },
  ],
  titleData = [{ title: "Total Sales", value: 47867 }],
  categories = ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
}) => {
  const [chartOptions, setChartOptions] = useState<any>(null);

  // Chart configuration
  const getSalesChartOptions = () => ({
    series: chartData,
    colors: [
      "#1D4ED8", // Base Blue (Primary)
      "#93C5FD", // Light Blue Tint
      "#2563EB", // Slightly Brighter Blue
      "#172554", // Deep Navy
      "#FACC15", // Complementary Golden Yellow
      "#F43F5E", // Vibrant Red Accent
      "#14B8A6", // Teal for contrast
      "#64748B", // Muted Blue-Gray
      "#0F172A", // Very Dark Blue
      "#E5E7EB"  // Soft Gray for balance
    ],
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 5 },
    xaxis: {
      categories: categories,
    },
    yaxis: {
      labels: {
        formatter: (value: number) => `$${value.toLocaleString()}`,
      },
    },
    tooltip: { theme: "dark" },
    grid: { borderColor: "#f1f1f1" },
  });

  // Initialize chart state
  useEffect(() => {
    setChartOptions(getSalesChartOptions());

    const rerenderChart = () => {
      setChartOptions(getSalesChartOptions());
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
        <div className="flex items-center gap-x-3">
          {titleData.map((data) => (
            <div key={data.title}>
              <h2 className="text-gray-500 dark:text-gray-400">{data.title}</h2>
              <span className="text-2xl font-bold leading-none text-gray-900 dark:text-white sm:text-3xl">
                {data.value} <span className="text-base font-medium">{data.unit}</span>
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700">
          {dateRange}
          <svg
            className="ml-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Line Chart */}
      <div className="py-6">
        {chartOptions && (
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="line"
            height={350}
          />
        )}
      </div>

      {redirectUrl && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700 sm:pt-6">
          {/* <button
            type="button"
            className="inline-flex items-center rounded-lg p-2 text-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Last 7 days
            <svg
              className="ml-1 h-4 w-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 9-7 7-7-7"
              />
            </svg>
          </button> */}
          <a
            href={redirectUrl}
            className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold uppercase text-primary-700 hover:bg-gray-100 dark:text-primary-500 dark:hover:bg-gray-700 sm:text-sm">
            {redirectText}
            <svg
              className="ml-1 h-4 w-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m9 5 7 7-7 7"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default LineChart;
