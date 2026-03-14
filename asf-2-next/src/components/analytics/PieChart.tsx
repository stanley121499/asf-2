import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

interface PieChartProps {
  title?: string;
  dateRange?: string;
  growthPercentage?: number;
  chartData?: { series: number[]; labels: string[] };
}

const PieChart: React.FC<PieChartProps> = ({
  title = "Website traffic",
  dateRange = "31 Nov - 31 Dec",
  growthPercentage,
  chartData = {
    series: [52.8, 26.8, 20.4],
    labels: ["Direct", "Organic search", "Referrals"],
  },
}) => {
  const [chartOptions, setChartOptions] = useState<any>(null);

  // Generate Chart Options
  const getTrafficChartOptions = () => {
    return {
      series: chartData.series,
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
        height: 420,
        width: "100%",
        type: "pie",
      },
      plotOptions: {
        pie: {
          labels: {
            show: true,
          },
          size: "100%",
          dataLabels: {
            offset: -25,
          },
        },
      },
      labels: chartData.labels,
      dataLabels: {
        enabled: true,
        style: {
          fontFamily: "Inter, sans-serif",
        },
      },
      legend: {
        position: "bottom",
        fontFamily: "Inter, sans-serif",
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${value}%`,
        },
      },
      xaxis: {
        labels: {
          formatter: (value: number) => `${value}%`,
        },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
    };
  };

  // Initialize the chart; getTrafficChartOptions is stable after mount
  useEffect(() => {
    setChartOptions(getTrafficChartOptions());

    const rerenderChart = () => {
      setChartOptions(getTrafficChartOptions());
    };

    // Handle theme changes dynamically
    document.addEventListener("rerender-charts", rerenderChart);
    return () => {
      document.removeEventListener("rerender-charts", rerenderChart);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 md:p-6">
      <div className="flex w-full items-start justify-between">
        <div className="flex-col items-center">
          <div className="mb-1 flex items-center">
            <h5 className="me-1 text-xl font-bold leading-none text-gray-900 dark:text-white">
              {title}
            </h5>
          </div>

          <button
            type="button"
            className="inline-flex items-center font-medium text-primary-700 hover:underline dark:text-primary-500">
            {dateRange}
            <svg
              className="ms-1 h-4 w-4"
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
          </button>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="py-6">
        {chartOptions && (
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="pie"
            height={420}
          />
        )}
      </div>

      {growthPercentage && (
        <div className="flex justify-center border-t border-gray-200 pt-4 text-gray-500 dark:border-gray-700 dark:text-gray-400 md:pt-6">
          <span className="me-2 inline-flex items-center font-medium text-green-500">
            <svg
              className="h-4 w-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v13m0-13 4 4m-4-4-4 4"
              />
            </svg>
            {growthPercentage}
          </span>
          compared to last month
        </div>
      )}
    </div>
  );
};

export default PieChart;
