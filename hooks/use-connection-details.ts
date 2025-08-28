import { useCallback, useEffect, useState } from 'react';
import { ConnectionDetails } from '@/app/api/connection-details/route';

export default function useConnectionDetails() {
  // Generate room connection details, including:
  //   - A random Room name
  //   - A random Participant name
  //   - An Access Token to permit the participant to join the room
  //   - The URL of the LiveKit server to connect to
  //
  // In real-world application, you would likely allow the user to specify their
  // own participant name, and possibly to choose from existing rooms to join.

  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    // Determine a safe base origin when embedded on arbitrary sites or file://
    const findScriptOrigin = () => {
      const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
      const found = scripts.find((s) => s.src.includes('embed-popup.js'));
      try {
        return found ? new URL(found.src).origin : undefined;
      } catch {
        return undefined;
      }
    };

    const defaultOrigin = 'https://replinai-widget.vercel.app';
    const scriptOrigin = findScriptOrigin();
    const pageOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const baseOrigin =
      scriptOrigin ||
      (pageOrigin && pageOrigin !== 'null' ? pageOrigin : undefined) ||
      defaultOrigin;

    const endpoint = process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
    const finalUrl = (() => {
      try {
        // If endpoint is absolute, use as-is
        if (/^https?:\/\//i.test(endpoint)) return new URL(endpoint).toString();
        // Otherwise, resolve relative to the chosen base origin
        return new URL(endpoint, baseOrigin).toString();
      } catch {
        return new URL('/api/connection-details', defaultOrigin).toString();
      }
    })();

    fetch(finalUrl)
      .then((res) => res.json())
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        console.error('Error fetching connection details:', error);
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return { connectionDetails, refreshConnectionDetails: fetchConnectionDetails };
}
