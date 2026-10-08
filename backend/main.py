from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

# =========================================================
# CREATE FASTAPI APP
# =========================================================

app = FastAPI(
    title="WeatherGPT API",
    description="Weather data backend for WeatherGPT",
    version="1.0.0"
)


# =========================================================
# CORS
# Allows React frontend to communicate with FastAPI
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "WeatherGPT backend is running!"
    }


# =========================================================
# WEATHER USING LATITUDE + LONGITUDE
# =========================================================

@app.get("/weather")
def get_weather(
    latitude: float,
    longitude: float
):

    weather_url = "https://api.open-meteo.com/v1/forecast"

    weather_params = {
        "latitude": latitude,
        "longitude": longitude,

        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ],

        "hourly": [
            "temperature_2m",
            "precipitation_probability",
            "precipitation"
        ],

        "timezone": "auto"
    }

    try:
        response = requests.get(
            weather_url,
            params=weather_params,
            timeout=10
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to weather service"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch weather data"
        )

    return response.json()


# =========================================================
# CITY NAME → COORDINATES → WEATHER SUMMARY
# =========================================================

@app.get("/weather-summary")
def weather_summary(city: str):

    # -----------------------------------------------------
    # STEP 1: GEOCODING
    # Convert city name into latitude and longitude
    # -----------------------------------------------------

    geocoding_url = (
        "https://geocoding-api.open-meteo.com/v1/search"
    )

    geocoding_params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json"
    }

    try:
        geo_response = requests.get(
            geocoding_url,
            params=geocoding_params,
            timeout=10
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to geocoding service"
        )

    if geo_response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail="Geocoding service unavailable"
        )

    geo_data = geo_response.json()

    if (
        "results" not in geo_data
        or not geo_data["results"]
    ):
        raise HTTPException(
            status_code=404,
            detail=f"Location '{city}' not found"
        )

    location = geo_data["results"][0]

    latitude = location["latitude"]
    longitude = location["longitude"]


    # -----------------------------------------------------
    # STEP 2: WEATHER API
    # -----------------------------------------------------

    weather_url = "https://api.open-meteo.com/v1/forecast"

    weather_params = {
        "latitude": latitude,
        "longitude": longitude,

        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m"
        ],

        "hourly": [
            "temperature_2m",
            "precipitation_probability",
            "precipitation"
        ],

        "timezone": "auto"
    }

    try:
        weather_response = requests.get(
            weather_url,
            params=weather_params,
            timeout=10
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to weather service"
        )

    if weather_response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail="Weather service unavailable"
        )

    weather_data = weather_response.json()


    # -----------------------------------------------------
    # STEP 3: EXTRACT CURRENT WEATHER
    # -----------------------------------------------------

    current = weather_data["current"]
    hourly = weather_data["hourly"]


    # -----------------------------------------------------
    # STEP 4: ANALYZE NEXT 24 HOURS
    # -----------------------------------------------------

    next_24_rain_probability = (
        hourly["precipitation_probability"][:24]
    )

    next_24_precipitation = (
        hourly["precipitation"][:24]
    )

    if next_24_rain_probability:
        max_rain_probability = max(
            next_24_rain_probability
        )
    else:
        max_rain_probability = 0

    total_precipitation = sum(
        next_24_precipitation
    )


    # -----------------------------------------------------
    # STEP 5: RETURN CLEAN RESPONSE
    # -----------------------------------------------------

    return {

        "location": {
            "name": location["name"],
            "country": location.get("country"),
            "state": location.get("admin1"),
            "latitude": latitude,
            "longitude": longitude
        },

        "current_weather": {

            "time": current["time"],

            "temperature_c":
                current["temperature_2m"],

            "feels_like_c":
                current["apparent_temperature"],

            "humidity_percent":
                current["relative_humidity_2m"],

            "precipitation_mm":
                current["precipitation"],

            "wind_speed_kmh":
                current["wind_speed_10m"],

            "weather_code":
                current["weather_code"]
        },

        "next_24_hours": {

            "maximum_rain_probability_percent":
                max_rain_probability,

            "total_precipitation_mm":
                round(total_precipitation, 2)
        }
    }