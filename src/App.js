import React, { useEffect, useState, useRef } from "react";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import ScaleBar from './ScaleBar';

const VIEW_STATES = {
  mizoram: {
    longitude: 92.9376,
    latitude: 23.1645,
    zoom: 7,
    pitch: 0,
    bearing: 0,
  },
  sonipat: {
    longitude: 77.0151,
    latitude: 28.9931,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  }
};

const App = () => {
  const [boundary, setBoundary] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [governmentOrPolice, setGovernmentOrPolice] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [mapStyle, setMapStyle] = useState("osm");
  const [buildingData, setBuildingData] = useState(null);
  const [showWatershed, setShowWatershed] = useState(false);
  const buildingFetchController = useRef(null);
  const [showBuildings, setShowBuildings] = useState(false);
  const [viewport, setViewport] = useState(VIEW_STATES.mizoram);
  const [selectedDataset, setSelectedDataset] = useState("mizoram");

  // Update viewport when dataset changes
  useEffect(() => {
    setViewport(VIEW_STATES[selectedDataset]);
    setBuildingData(null); // Clear building data when switching datasets
  }, [selectedDataset]);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const isMizoram = selectedDataset === "mizoram";

        const [boundaryRes, hospitalRes, governmentOrPoliceRes] = await Promise.all([
          fetch(isMizoram ? "/export.geojson" : "/sonipat_boundary.geojson"),
          fetch(isMizoram ? "/hospital.geojson" : "/sonipat_hospital.geojson"),
          fetch(isMizoram ? "/police.geojson" : "/sonipat_police.geojson"),
        ]);

        const [boundaryData, hospitalData, governmentOrPoliceData] = await Promise.all([
          boundaryRes.json(),
          hospitalRes.json(),
          governmentOrPoliceRes.json(),
        ]);

        console.log(boundaryData);
        console.log(hospitalData);
        console.log(governmentOrPoliceData);


        setBoundary(boundaryData);
        setHospitals(hospitalData);
        setGovernmentOrPolice(governmentOrPoliceData);
      } catch (error) {
        console.error("Error loading static data:", error);
      }
    };

    fetchStaticData();
  }, [selectedDataset]);


  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!boundary || viewport.zoom < 7) return;
  
      if (buildingFetchController.current) {
        buildingFetchController.current.abort();
      }
  
      buildingFetchController.current = new AbortController();
  
      try {
        const buildingRes = await fetch(
          selectedDataset === "mizoram" ? "/buildings.geojson" : "/sonipat_building.geojson"
        );
        const buildingData = await buildingRes.json();

        setBuildingData(buildingData);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching building data:", error);
        }
      }
    };
  
    fetchBuildingData();
    
    return () => {
      if (buildingFetchController.current) {
        buildingFetchController.current.abort();
      }
    };
  }, [boundary, selectedDataset]);

  const setHover = (info) => {
    if (info?.object) {
      setHoverInfo({
        x: info.x || 0,
        y: info.y || 0,
        properties: info.object?.properties,
      });
    } else {
      setHoverInfo(null);
    }
  };

  const layers = [
    new GeoJsonLayer({
      id: "boundary",
      data: boundary,
      filled: true,
      stroked: true,
      lineWidthMinPixels: 2,
      getFillColor: [200, 200, 200, 100], // This determines the fill color (currently gray with transparency)
      getLineColor: [0, 0, 0, 255], // Boundary stroke color (black)
      pickable: true,
      onHover: setHover,
    }),
    ...(showBuildings ? [
      new GeoJsonLayer({
        id: "buildings",
        data: buildingData,
        filled: true,
        getFillColor: [0, 0, 255, 100],
        stroked: true,
        getLineColor: [0, 0, 255, 150],
        lineWidthMinPixels: 1,
        pickable: true,
        wireframe: true,
        updateTriggers: {
          data: [viewport.zoom]
        }
      })
    ] : []),
    new GeoJsonLayer({
      id: "governmentOrPolice",
      data: governmentOrPolice,
      filled: true,
      stroked: true,
      pointRadiusUnits: "pixels",
      getPointRadius: 5,
      //getFillColor: [0, 255, 0],
      lineWidthMinPixels: 1,
      pickable: true,
      onHover: setHover,
      getLineColor: [0, 255, 0],
      opacity: selectedDataset === "sonipat" ? 0.3 : 1,
      parameters: {
        depthTest: false
      }
    }),
    new GeoJsonLayer({
      id: "hospitals",
      data: hospitals,
      pointRadiusUnits: "pixels",
      getPointRadius: 6, // Slightly larger to be more visible
      getFillColor: [255, 0, 0],
      pickable: true,
      onHover: setHover,
      // Always render on top
      parameters: {
        depthTest: false
      },
      // Add outline to make points more visible
      stroked: true,
      getLineColor: [200, 0, 0],
      lineWidthMinPixels: 1
    })
  ];

  const mapStyles = {
    osm: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors",
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    },
    terrain: {
      version: 8,
      sources: {
        terrain: {
          type: "raster-dem",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "&copy; Mapzen",
        },
      },
      layers: [{
        id: "terrain",
        type: "hillshade",
        source: "terrain",
        exaggeration: 1.5,
      }],
    },
    watershed: {
      version: 8,
      sources: {
        watershed: {
          type: "raster",
          tiles: [
            "https://tile.opentopomap.org/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "&copy; OpenTopoMap contributors",
        },
      },
      layers: [{ id: "watershed", type: "raster", source: "watershed" }],
    },
  };

  return (
    <div className="app-container">
      <DeckGL
        initialViewState={VIEW_STATES[selectedDataset]}
        controller={true}
        layers={layers}
        onViewStateChange={({ viewState }) => {
          setViewport(viewState);
          setHoverInfo(null);
        }}
      >
        <Map
          mapStyle={showWatershed ? mapStyles.watershed : mapStyles[mapStyle]}
        />
      </DeckGL>

      {hoverInfo && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            left: `${hoverInfo.x}px`,
            top: `${hoverInfo.y}px`,
            backgroundColor: "white",
            padding: "5px",
            border: "1px solid black",
            pointerEvents: "none",
          }}
        >
          <strong>Name:</strong> {hoverInfo.properties?.name || "N/A"}
          <br />
          <strong>Type:</strong> {hoverInfo.properties?.type || "N/A"}
        </div>
      )}

      <div className="legend">
        <h4>Legend</h4>
        <div>
          <span style={{ backgroundColor: "red" }} className="legend-box"></span>{" "}
          Hospitals
        </div>
        <div>
          <span style={{ backgroundColor: "green" }} className="legend-box"></span>{" "}
          Government/Police Facilities
        </div>
        <div>
          <span style={{ backgroundColor: "blue" }} className="legend-box"></span>{" "}
          Buildings
        </div>
      </div>

      <div className="map-controls">
        <div className="dataset-toggle">
          <label>
            Dataset:
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              <option value="mizoram">Mizoram</option>
              <option value="sonipat">Sonipat</option>
            </select>
          </label>
        </div>
        <div className="map-toggle">
          <button onClick={() => {
            setMapStyle(mapStyle === "osm" ? "terrain" : "osm");
            setShowWatershed(false);
          }}>
            Switch to {mapStyle === "osm" ? "Terrain" : "OSM"} View
          </button>
        </div>
        <div className="buildings-toggle">
          <button onClick={() => setShowBuildings(!showBuildings)}>
            {showBuildings ? "Hide" : "Show"} Buildings
          </button>
        </div>
        <div className="watershed-toggle">
          <button onClick={() => {
            setShowWatershed(!showWatershed);
            if (!showWatershed) {
              setMapStyle("osm");
            }
          }}>
            {showWatershed ? "Hide" : "Show"} Watershed
          </button>
        </div>
      </div>
      <ScaleBar className="scale-bar" viewport={viewport} />
    </div>
  );
};

export default App;
