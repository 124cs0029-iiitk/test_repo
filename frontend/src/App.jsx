import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/weather-summary?city=${encodeURIComponent(
          city.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to fetch weather.");
      }

      setWeather(data);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to WeatherGPT backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      getWeather();
    }
  };

  const getWeatherDescription = (code) => {
    const descriptions = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Foggy",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Heavy drizzle",
      61: "Light rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Light snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Light rain showers",
      81: "Moderate rain showers",
      82: "Heavy rain showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Thunderstorm with heavy hail",
    };

    return descriptions[code] || "Unknown weather";
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="logo">
          🌦️ WeatherGPT
        </div>

        <p>
          AI-powered weather intelligence and decision support
        </p>
      </header>


      {/* MAIN CONTENT */}
      <main className="container">

        {/* SEARCH */}
        <section className="search-section">

          <h1>Check Weather</h1>

          <p className="subtitle">
            Get real-time weather information for any location
          </p>

          <div className="search-box">

            <input
              type="text"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={getWeather}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>

          </div>

          <p className="example">
            Try: Kurnool, Hyderabad, Bengaluru, Chennai
          </p>

        </section>


        {/* ERROR */}
        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}


        {/* LOADING */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Fetching real-time weather data...</p>
          </div>
        )}


        {/* WEATHER RESULT */}
        {weather && !loading && (

          <section className="weather-section">

            {/* LOCATION */}
            <div className="location">

              <h2>
                📍 {weather.location.name}
              </h2>

              <p>
                {weather.location.state
                  ? `${weather.location.state}, `
                  : ""}
                {weather.location.country}
              </p>

            </div>


            {/* CURRENT WEATHER */}
            <div className="main-card">

              <div className="temperature-area">

                <div className="weather-icon">
                  {weather.current_weather.weather_code === 0
                    ? "☀️"
                    : weather.current_weather.weather_code <= 3
                    ? "⛅"
                    : weather.current_weather.weather_code >= 95
                    ? "⛈️"
                    : "🌧️"}
                </div>

                <div className="temperature">
                  {weather.current_weather.temperature_c}
                  <span>°C</span>
                </div>

                <p className="description">
                  {getWeatherDescription(
                    weather.current_weather.weather_code
                  )}
                </p>

              </div>


              <div className="weather-info">

                <div className="weather-row">
                  <span>🌡️ Feels like</span>
                  <strong>
                    {weather.current_weather.feels_like_c}°C
                  </strong>
                </div>

                <div className="weather-row">
                  <span>💧 Humidity</span>
                  <strong>
                    {weather.current_weather.humidity_percent}%
                  </strong>
                </div>

                <div className="weather-row">
                  <span>💨 Wind speed</span>
                  <strong>
                    {weather.current_weather.wind_speed_kmh} km/h
                  </strong>
                </div>

                <div className="weather-row">
                  <span>🌧️ Current rainfall</span>
                  <strong>
                    {weather.current_weather.precipitation_mm} mm
                  </strong>
                </div>

              </div>

            </div>


            {/* FORECAST CARDS */}
            <div className="cards">

              {/* RAIN PROBABILITY */}
              <div className="info-card">

                <div className="card-icon">
                  🌧️
                </div>

                <div>

                  <h3>
                    Rain Probability
                  </h3>

                  <p className="big-number">
                    {
                      weather.next_24_hours
                        .maximum_rain_probability_percent
                    }%
                  </p>

                  <p>
                    Maximum probability during
                    the next 24 hours
                  </p>

                </div>

              </div>


              {/* EXPECTED RAIN */}
              <div className="info-card">

                <div className="card-icon">
                  💦
                </div>

                <div>

                  <h3>
                    Expected Rainfall
                  </h3>

                  <p className="big-number">
                    {
                      weather.next_24_hours
                        .total_precipitation_mm
                    } mm
                  </p>

                  <p>
                    Expected precipitation during
                    the next 24 hours
                  </p>

                </div>

              </div>

            </div>


            {/* WEATHERGPT AI */}
            <div className="assistant-card">

              <div className="ai-title">
                <span className="ai-icon">
                  🤖
                </span>

                <div>
                  <h2>
                    Ask WeatherGPT
                  </h2>

                  <p>
                    Get intelligent answers based on
                    weather conditions.
                  </p>
                </div>
              </div>


              <div className="question-box">

                <input
                  type="text"
                  placeholder="Example: Should I water my tomato plants tomorrow?"
                  disabled
                />

                <button disabled>
                  Ask AI
                </button>

              </div>

              <div className="coming-soon">
                🚀 AI decision-support module
                will be added next
              </div>

            </div>

          </section>

        )}

      </main>


      {/* FOOTER */}
      <footer>
        <p>
          WeatherGPT • AI-powered weather intelligence
        </p>

        <p className="footer-small">
          Built using React + FastAPI + Open-Meteo
        </p>
      </footer>

    </div>
  );
}

export default App;