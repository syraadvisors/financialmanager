/// <reference path="../types/google-maps.d.ts" />
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressComponents) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  apiKey?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Enter street address',
  disabled = false,
  style,
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null); // Google Maps Autocomplete instance
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    // Debug logging
    console.log('AddressAutocomplete: API Key present:', !!apiKey);
    console.log('AddressAutocomplete: API Key length:', apiKey?.length || 0);

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('AddressAutocomplete: Google Maps already loaded');
      setScriptLoaded(true);
      return;
    }

    // Check if API key is available
    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      console.warn('Google Maps API key not found. Add REACT_APP_GOOGLE_MAPS_API_KEY to your .env.local file.');
      console.warn('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));
      return;
    }

    console.log('AddressAutocomplete: Loading Google Maps script...');

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      console.log('AddressAutocomplete: Google Maps script loaded successfully');
      setScriptLoaded(true);
      setLoadError(null);
    });

    script.addEventListener('error', () => {
      setLoadError('Failed to load Google Maps API');
      console.error('Failed to load Google Maps API');
    });

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount if needed
      const scriptElement = document.querySelector('script[src*="maps.googleapis.com"]');
      if (scriptElement && scriptElement.parentNode) {
        // Don't remove the script as it might be used by other components
        // scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [apiKey]);

  // Initialize autocomplete
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    try {
      // Initialize the autocomplete
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US addresses
        fields: ['address_components', 'formatted_address', 'geometry']
      });

      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();

        if (!place || !place.address_components) {
          return;
        }

        setIsLoading(true);

        // Parse address components
        const addressComponents: AddressComponents = {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        };

        let streetNumber = '';
        let route = '';

        place.address_components.forEach((component: any) => {
          const types = component.types;

          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality')) {
            addressComponents.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            addressComponents.state = component.short_name;
          }
          if (types.includes('postal_code')) {
            addressComponents.zipCode = component.long_name;
          }
          if (types.includes('country')) {
            addressComponents.country = component.short_name;
          }
        });

        // Combine street number and route
        addressComponents.street = `${streetNumber} ${route}`.trim();

        // Update the input value
        onChange(addressComponents.street);

        // Call the callback with parsed address
        if (onAddressSelect) {
          onAddressSelect(addressComponents);
        }

        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setLoadError('Failed to initialize address autocomplete');
    }
  }, [scriptLoaded, onChange, onAddressSelect]);

  // If no API key, render a basic input
  if (!apiKey || loadError) {
    return (
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={style}
        />
        {loadError && (
          <div style={{
            fontSize: '11px',
            color: '#ef4444',
            marginTop: '4px'
          }}>
            {loadError} - Using basic text input
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        style={{
          ...style,
          paddingRight: isLoading ? '40px' : undefined
        }}
      />
      {isLoading && (
        <Loader
          size={16}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#2196f3',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
    </div>
  );
};

export default AddressAutocomplete;
