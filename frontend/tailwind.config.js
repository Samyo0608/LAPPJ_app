const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js",
    flowbite.content(),
  ],
  theme: {
    extend: {
      minHeight: {
        allView: "calc(100vh - 6rem)",
        halfVh: "50vh",
        "40vh": "40vh"
      },
      textColor: {
        red: {
          100: 'FFD2D2',
          200: 'rgb(255, 82, 82)',
          300: 'FF2D2D',
          400: 'rgb(255, 0, 0)',
        }
      }
    },
  },
  plugins: [
    flowbite.content(),
  ]
}