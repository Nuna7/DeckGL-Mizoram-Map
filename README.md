## Mizoram and Sonipat Map Visualization

### Overview

This application provides an interactive visualization of Mizoram's and Sonipat's geographical data, including boundaries, hospitals, government facilities, and buildings. The visualization is built using Deck.gl and MapLibre.

### Features
- Interactive map with zoom and pan functionality
- Visualization of Mizoram's and Sonipat's boundary, hospitals, police facilities, and buildings
- Hover-over tooltips for feature information
- Legend for feature categorization
- Map style toggles for OSM, Terrain, and Watershed views
- Building visibility toggle
- A scale bar representing distance in kilometres obtained from calculating mercator projection.
- Open street map, Terrain and Water shed layer. 

### Technical Details
- Built using React, Deck.gl, and MapLibre
- Utilizes GeoJSON data for feature visualization
- Use Overpass Turbo to get the GeoJSON data.

### Future Extensions
- Integrate more complex data sources for enhanced visualization and analysis
- Implement filtering and search functionality for features
- Develop a dashboard for data analysis and insights
- Explore 3D visualization capabilities using Deck.gl

## Installation and Running Guidelines
### Prerequisites
1. Node.js: Ensure you have Node.js installed on your system. The project is tested with Node.js version 16.x (or specify your version).
2. NPM or Yarn: Ensure you have either NPM (comes with Node.js) or Yarn installed. You can install Yarn using:
```bash
npm install --global yarn
```

### Installation Steps
1. Clone the repository:

```bash
git clone https://github.com/Nuna7/DeckGL-Map.git
cd DeckGL-Map
```

2. Install dependencies: Run the following command to install the necessary node_modules:

```bash
npm install
```

OR, if you're using Yarn:

```bash
yarn install
```

This command reads the package.json and installs all the dependencies listed in the dependencies and devDependencies sections.

3. Start the development server:

```bash
npm start
```

OR, with Yarn:

```bash
yarn start
```

The application will be available at http://localhost:3000/ in your browser.



