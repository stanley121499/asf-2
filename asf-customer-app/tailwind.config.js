/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./context/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: "#C9A96E",
        bg: "#FFFFFF",
        border: "#E5E5E3",
        muted: "#6B7280",
        panel: "#F5F5F3",
        text: "#0A0A0A",
        danger: "#E8453C",
        success: "#22C55E",
      },
      fontFamily: {
        display: ["PlayfairDisplay_400Regular"],
        sans: ["Inter_400Regular"],
      },
    },
  },
  plugins: [],
};
