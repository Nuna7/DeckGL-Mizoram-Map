import React, { useEffect, useState } from 'react';

const ScaleBar = ({ viewport }) => {
  const [scaleWidth, setScaleWidth] = useState(100);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    // Calculate ground resolution at current latitude in meters per pixel
    // 156543.03392 * cos(latitude) / 2^zoom is the standard Web Mercator projection formula. 
    // It accounts for the Earth's curvature through the cosine of latitude
    // We multiply the latitude by Math.PI / 180 to convert degrees to radians as javascript expect angle to be in radians (not degree) 
    const groundResolution = (156543.03392 * Math.cos(viewport.latitude * Math.PI / 180)) / Math.pow(2, viewport.zoom);
    
    // Convert to km per pixel
    const kmPerPixel = groundResolution / 1000;
    
    // We want the scale bar to be roughly 100-200 pixels wide
    const targetWidthKm = kmPerPixel * 150;
    
    // Round to a nice number
    // getNiceNumber function ensures readable, round numbers (1, 2, 5, 10, etc.)
    const niceDistance = getNiceNumber(targetWidthKm);
    
    // Calculate the pixel width for this nice number
    const pixelWidth = niceDistance / kmPerPixel;
    
    setScaleWidth(pixelWidth);
    setDistance(niceDistance);
  }, [viewport.zoom, viewport.latitude]);

  // Helper function to get nice round numbers for the scale
  const getNiceNumber = (num) => {
    const exponent = Math.floor(Math.log10(num));
    const fraction = num / Math.pow(10, exponent);
    
    let niceFraction;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    
    return niceFraction * Math.pow(10, exponent);
  };

  if (viewport.zoom < 9) return;

  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      left: '20px',
      backgroundColor: 'white',
      padding: '8px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            height: '4px', 
            backgroundColor: 'black', 
            width: `${scaleWidth}px` 
          }}></div>
        </div>
        <div style={{ 
          fontSize: '12px', 
          marginTop: '4px', 
          textAlign: 'center' 
        }}>{distance} km</div>
      </div>
    </div>
  );
};

export default ScaleBar;