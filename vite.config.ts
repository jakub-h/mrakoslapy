import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/mrakoslapy/",
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Mrakošlapi – šéf hry",
        short_name: "Mrakošlapi",
        lang: "cs",
        display: "standalone",
        background_color: "#1b1d26",
        theme_color: "#1b1d26",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    }),
  ],
});
