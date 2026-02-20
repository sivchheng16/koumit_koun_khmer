/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
        './src/**/*.{html,js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            keyframes: {
                wave: {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(20deg)' },
                    '75%': { transform: 'rotate(-20deg)' },
                },
            },
            animation: {
                'waving-hand': 'wave 1s linear infinite',
            },
        },
    },
}
