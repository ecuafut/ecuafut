import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite la carga optimizada de imágenes desde cualquier dominio externo de forma segura
      },
    ],
  },
};

export default nextConfig;