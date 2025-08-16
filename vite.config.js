import { defineConfig } from "vite";

export default defineConfig({
  base: "/WeDesWeb/", // change to "/<repo>/" for GitHub Pages project site
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      // Include both pages in the production build
      input: {
        index: "index.html",
        page2: "src/page2.html",
        page3: "src/page3.html",
        page4: "src/page4.html",
        page5: "src/project.html",
        page6: "src/bonding.html",
        page7: "src/reason.html",
        page8: "src/showcase.html",
      },
    },
  },
});
