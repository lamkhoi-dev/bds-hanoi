import { useState, useEffect } from 'react';

export interface LocationNode {
  id: string | number;
  name: string;
  type?: string;
  children?: LocationNode[];
}

export function useLocations() {
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = publicApiUrl || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/locations`);
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (error) {
        console.error("Failed to fetch locations", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  return { locations, loading };
}
