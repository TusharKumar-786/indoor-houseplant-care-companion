import React, { useState, useEffect } from 'react';
import { CloudSun, Droplets, Wind, Thermometer, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  cityName: string;
  tip: string;
}

export const WeatherTipCard: React.FC = () => {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchWeather = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const city = user?.city || 'New Delhi';

      // Geocoding city name via Open-Meteo geocoding API
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();

      let lat = 28.6139;
      let lon = 77.209;
      let resolvedName = city;

      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        resolvedName = `${geoData.results[0].name}, ${geoData.results[0].country_code?.toUpperCase() || ''}`;
      }

      // Fetch live weather from Open-Meteo
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
      );
      const wData = await weatherRes.json();

      const temp = Math.round(wData.current.temperature_2m);
      const humidity = Math.round(wData.current.relative_humidity_2m);

      // Generate practical botanical recommendation
      let tip = '';
      if (humidity < 40) {
        tip = 'Dry indoor air today. Group tropical plants together or mist delicate ferns to curb moisture loss.';
      } else if (temp > 28) {
        tip = 'Warm climate conditions. Check topsoil moisture more frequently as evaporation rates increase.';
      } else if (temp < 15) {
        tip = 'Cool seasonal weather. Reduce watering frequency and shield plants from cold drafts near windowpanes.';
      } else {
        tip = 'Balanced temperature and ambient humidity. Maintain regular scheduled care intervals.';
      }

      setWeather({
        temp,
        humidity,
        condition: humidity > 70 ? 'Humid' : temp > 25 ? 'Warm' : 'Mild',
        cityName: resolvedName,
        tip,
      });
    } catch (err) {
      setIsError(true);
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [user?.city]);

  return (
    <div className="card p-5 bg-white border border-[#C9D8C5] shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E4EDB8] text-[#1F3D2B] flex items-center justify-center">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#3E7B52]">
              Microclimate Advisory
            </span>
            <h3 className="font-serif font-bold text-sm text-[#1F3D2B]">
              {weather?.cityName || (user?.city || 'Local Indoor Garden')}
            </h3>
          </div>
        </div>

        <button
          onClick={fetchWeather}
          disabled={isLoading}
          className="p-1 rounded-lg text-[#736159] hover:text-[#1F3D2B] hover:bg-[#F5F1E6] transition-colors"
          aria-label="Refresh weather"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-1">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-full" />
        </div>
      ) : isError || !weather ? (
        <div className="py-2.5 px-3.5 flex items-center justify-between text-xs text-[#736159] bg-[#F5F1E6]/70 rounded-xl border border-[#C9D8C5]/50">
          <span>Weather unavailable</span>
          <button
            onClick={fetchWeather}
            className="font-semibold text-[#3E7B52] hover:underline flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#1F3D2B] py-1">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-[#C8693F]" />
              {weather.temp}°C
            </span>
            <span className="text-[#C9D8C5]">|</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#3E7B52]" />
              {weather.humidity}% Humidity
            </span>
          </div>

          <p className="text-xs text-[#736159] leading-relaxed bg-[#F5F1E6]/70 p-2.5 rounded-xl border border-[#C9D8C5]/50">
            {weather.tip}
          </p>
        </>
      )}
    </div>
  );
};
