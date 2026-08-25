/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondos principales
        bg-plumbago: {
          DEFAULT: '#6B8CA4', // Azul bg-plumbago (tu color principal)
          light: '#8F9FA8',   // Neutro/Azul desaturado (para bordes y detalles)
        },
        night: {
          DEFAULT: '#0C141A', // Azul ultra oscuro (para contraste y tarjetas)
          soft: '#16242F',    // Variación sutil para hover o modales
        },
        // Acentos y Textos
        silver: {
          DEFAULT: '#C0C7CB', // Plata premium (reemplaza al dorado)
          dark: '#9EA4A2',    // Plata verdoso/neutro (reemplaza al dorado opaco)
          light: '#F4F6F8',   // Casi blanco/plata muy brillante (para textos principales)
        }
      }
    },
  },
  plugins: [],
}