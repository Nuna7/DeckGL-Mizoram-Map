import bbox from "@turf/bbox";
import booleanWithin from "@turf/boolean-within";
import { centroid, bboxPolygon, featureCollection } from "@turf/turf";
import osmtogeojson from "osmtogeojson";
import fs from 'fs/promises';
import fetch from 'node-fetch';

const fetchAndSaveBuildings = async () => {
    const url = 'https://overpass-api.de/api/interpreter?data=[out:json];way[building](21.58,92.15,24.52,94.00);out geom;';
    const outputPath = './public/buildings.geojson';
    const boundaryUrl = './public/export.geojson';

    try {
        const boundaryData = JSON.parse(await fs.readFile(boundaryUrl, 'utf8'));

        console.log('Fetching building data...');
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data = await response.json();
        const geojson = osmtogeojson(data);

        const boundaryBBox = bbox(boundaryData);
        const flattenedFeatures = geojson.features.flat();
        
        const filteredBuildings = featureCollection(
          flattenedFeatures.filter((feature) => {
            if (feature && feature.geometry?.type === "Polygon") {
              const featureCentroid = centroid(feature);
              return booleanWithin(featureCentroid, bboxPolygon(boundaryBBox));
            }
            return false;
          })
        );
        const processedBuildingData = {
          type: 'FeatureCollection',
          features: filteredBuildings.features
        };

        await fs.writeFile(outputPath, JSON.stringify(processedBuildingData, null, 2));
        console.log(`Building data saved to ${outputPath}`);
    } catch (error) {
        console.error('Error fetching or saving building data:', error);
    }
};

fetchAndSaveBuildings();