STEP-UP LINK <!-- https://chatgpt.com/c/69033e39-d4a4-8323-8165-ddb453edf1cb -->

E-Jamaat (Electron+React)

⚙️ 1. Create React + Vite App

# create project

npm create vite@latest

cd E-Jamaat

npm install tailwindcss @tailwindcss/vite

Replace everything in src/index.css with the following:

@import "tailwindcss";

# update ur vite.config.js

import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
plugins: [react(), tailwindcss()],
resolve: {
alias: {
"@": path.resolve(\_\_dirname, "src"),
},
},
});

# jsconfig.json

{
"compilerOptions": {
"baseUrl": ".",
"paths": {
"@/_": ["src/_"]
}
},
"include": ["src"]
}

# ELECTRON

# packages

npm install fs https jsonwebtoken mongoose os cloudinary bcryptjs dotenv electron-is-dev electron-store

# dev packages

npm install electron-reloader --save-dev
npm install electron cross-env  --save-dev
npm install concurrently wait-on --save-dev
