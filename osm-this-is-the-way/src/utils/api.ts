// utils/api.ts
import { OSMHistory } from '@/types';

export async function fetchOSMHistory(elementType: string, elementId: string): Promise<OSMHistory> {
  // Overpass API endpoint
  const overpassEndpoint = 'https://overpass-api.de/api/interpreter';
  const osmApiEndpoint = 'https://api.openstreetmap.org/api/0.6';
  
  console.log(`Fetching history for ${elementType}/${elementId}`);

  // Build Overpass query to get full history
  const query = `
    [out:json];
    ${elementType}(${elementId});
    out meta geom;
    ${elementType}.history(${elementId});
    out meta geom;
  `;

  console.log('Query:', query);


  try {
    // const response = await fetch(overpassEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: `data=${encodeURIComponent(query)}`,
    // });

    const osmFeatureApiUrl = `${osmApiEndpoint}/${elementType}/${elementId}/history.json`;
    const response = await fetch(osmFeatureApiUrl)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching OSM history:', errorText);      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);

    // Sort elements by version
    const sortedElements = data.elements.sort((a: any, b: any) => a.version - b.version);
    console.log(`Processed ${sortedElements.length} versions`);

    return {
      elements: sortedElements,
    };
  } catch (error) {
    console.error('Error fetching OSM history:', error);
    throw error;
  }
}
