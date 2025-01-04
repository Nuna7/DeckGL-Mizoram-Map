import React, { useEffect, useState, useRef } from "react";
import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

const INITIAL_VIEW_STATE = {
  longitude: 92.9376,
  latitude: 23.1645,
  zoom: 7,
  pitch: 0,
  bearing: 0,
};

const App = () => {
  const [mizoramBoundary, setMizoramBoundary] = useState(null);
  const [hospitals, setHospitals] = useState(null);
  const [government, setGovernment] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [mapStyle, setMapStyle] = useState("osm");
  const [buildingData, setBuildingData] = useState(null);
  const [showWatershed, setShowWatershed] = useState(false);
  const buildingFetchController = useRef(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [viewport, setViewport] = useState(INITIAL_VIEW_STATE);
  

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [boundaryRes, hospitalRes, governmentRes] = await Promise.all([
          fetch("/export.geojson"),
          fetch("/hospital.geojson"),
          fetch("/government.geojson"),
        ]);

        const [boundaryData, hospitalData, governmentData] = await Promise.all([
          boundaryRes.json(),
          hospitalRes.json(),
          governmentRes.json(),
        ]);

        setMizoramBoundary(boundaryData);
        setHospitals(hospitalData);
        setGovernment(governmentData);
      } catch (error) {
        console.error("Error loading static data:", error);
      }
    };

    fetchStaticData();
  }, []);

  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!mizoramBoundary || viewport.zoom < 7) return;
  
      if (buildingFetchController.current) {
        buildingFetchController.current.abort();
      }
  
      buildingFetchController.current = new AbortController();
  
      try {
        const buildingRes = await fetch("/buildings.geojson");
        const buildingData = await buildingRes.json();

        console.log("Once")

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
    }, [mizoramBoundary]);

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
      id: "mizoram-boundary",
      data: mizoramBoundary,
      filled: true,
      stroked: true,
      lineWidthMinPixels: 2,
      getFillColor: [200, 200, 200, 100],
      getLineColor: [0, 0, 0, 255],
      pickable: true,
      onHover: setHover,
    }),
    new GeoJsonLayer({
      id: "hospitals",
      data: hospitals,
      pointRadiusUnits: "pixels",
      getPointRadius: 5,
      getFillColor: [255, 0, 0],
      pickable: true,
      onHover: setHover,
    }),
    new GeoJsonLayer({
      id: "government",
      data: government,
      pointRadiusUnits: "pixels",
      getPointRadius: 5,
      getFillColor: [0, 255, 0],
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
        initialViewState={INITIAL_VIEW_STATE}
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
          Government Facilities
        </div>
        <div>
          <span style={{ backgroundColor: "blue" }} className="legend-box"></span>{" "}
          Buildings
        </div>
      </div>
      <div className="map-controls">
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
    </div>
  );
};

export default App;