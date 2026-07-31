import pandas as pd
from typing import Tuple, Optional

COMPOUNDS = {
    "Soft  (Red)": {"color": "#e8002d", "icon": "🔴", "min": 10, "max": 25, "deg_mult": 1.6, "code": "S"},
    "Medium  (Yellow)": {"color": "#ffd700", "icon": "🟡", "min": 20, "max": 38, "deg_mult": 1.0, "code": "M"},
    "Hard  (White)": {"color": "#c8c8d8", "icon": "⚪", "min": 30, "max": 55, "deg_mult": 0.65, "code": "H"},
    "Intermediate  (Green)": {"color": "#39d353", "icon": "🟢", "min": 10, "max": 30, "deg_mult": 1.2, "code": "I"},
    "Wet  (Blue)": {"color": "#378ADD", "icon": "🔵", "min": 5, "max": 20, "deg_mult": 1.8, "code": "W"},
}

CIRCUITS = {
    "Australian GP (Melbourne)":    {"id": 1,  "laps": 58, "base_pace": 88.0},
    "Malaysian GP (Sepang)":        {"id": 2,  "laps": 56, "base_pace": 100.0},
    "Bahrain GP":                   {"id": 3,  "laps": 57, "base_pace": 96.0},
    "Monaco GP":                    {"id": 6,  "laps": 78, "base_pace": 75.0},
    "Spanish GP (Barcelona)":       {"id": 4,  "laps": 66, "base_pace": 82.0},
    "Canadian GP (Montreal)":       {"id": 7,  "laps": 70, "base_pace": 77.0},
    "British GP (Silverstone)":     {"id": 9,  "laps": 52, "base_pace": 91.5},
    "German GP (Hockenheim)":       {"id": 11, "laps": 67, "base_pace": 83.0},
    "Hungarian GP (Budapest)":      {"id": 11, "laps": 70, "base_pace": 81.0},
    "Belgian GP (Spa)":             {"id": 13, "laps": 44, "base_pace": 109.0},
    "Italian GP (Monza)":           {"id": 14, "laps": 53, "base_pace": 84.0},
    "Singapore GP":                 {"id": 15, "laps": 62, "base_pace": 103.0},
    "Japanese GP (Suzuka)":         {"id": 22, "laps": 53, "base_pace": 93.0},
    "US GP (COTA)":                 {"id": 69, "laps": 56, "base_pace": 97.0},
    "Mexican GP (Mexico City)":     {"id": 32, "laps": 71, "base_pace": 80.0},
    "Brazilian GP (Interlagos)":    {"id": 18, "laps": 71, "base_pace": 75.0},
    "Abu Dhabi GP (Yas Marina)":    {"id": 24, "laps": 55, "base_pace": 99.0},
    "Austrian GP (Red Bull Ring)":  {"id": 70, "laps": 71, "base_pace": 67.0},
    "French GP (Paul Ricard)":      {"id": 34, "laps": 53, "base_pace": 95.0},
    "Azerbaijan GP (Baku)":         {"id": 73, "laps": 51, "base_pace": 105.0},
    "Russian GP (Sochi)":           {"id": 71, "laps": 53, "base_pace": 97.0},
    "Dutch GP (Zandvoort)":         {"id": 39, "laps": 72, "base_pace": 74.0},
    "Miami GP":                     {"id": 80, "laps": 57, "base_pace": 91.0},
    "Las Vegas GP":                 {"id": 81, "laps": 50, "base_pace": 96.0},
    "Qatar GP (Lusail)":            {"id": 78, "laps": 57, "base_pace": 88.0},
    "Saudi Arabian GP (Jeddah)":    {"id": 77, "laps": 50, "base_pace": 91.0},
    "Chinese GP (Shanghai)":        {"id": 17, "laps": 56, "base_pace": 95.0},
    "Turkish GP (Istanbul)":        {"id": 21, "laps": 58, "base_pace": 92.0},
    "Korean GP (Yeongam)":          {"id": 38, "laps": 55, "base_pace": 104.0},
    "Indian GP (Buddh)":            {"id": 67, "laps": 60, "base_pace": 94.0},
}

GRID = {
    2009: {
        "Brawn GP":       {"id": 117, "drivers": ["Jenson Button", "Rubens Barrichello"]},
        "Red Bull":       {"id": 9,   "drivers": ["Sebastian Vettel", "Mark Webber"]},
        "McLaren":        {"id": 1,   "drivers": ["Lewis Hamilton", "Heikki Kovalainen"]},
        "Ferrari":        {"id": 6,   "drivers": ["Kimi Räikkönen", "Felipe Massa"]},
        "Toyota":         {"id": 14,  "drivers": ["Jarno Trulli", "Timo Glock"]},
        "Williams":       {"id": 3,   "drivers": ["Nico Rosberg", "Kazuki Nakajima"]},
        "Renault":        {"id": 4,   "drivers": ["Fernando Alonso", "Nelson Piquet Jr."]},
        "BMW Sauber":     {"id": 15,  "drivers": ["Robert Kubica", "Nick Heidfeld"]},
        "Force India":    {"id": 21,  "drivers": ["Giancarlo Fisichella", "Adrian Sutil"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Sebastien Buemi", "Jaime Alguersuari"]},
    },
    2010: {
        "Red Bull":       {"id": 9,   "drivers": ["Sebastian Vettel", "Mark Webber"]},
        "McLaren":        {"id": 1,   "drivers": ["Lewis Hamilton", "Jenson Button"]},
        "Ferrari":        {"id": 6,   "drivers": ["Fernando Alonso", "Felipe Massa"]},
        "Mercedes":       {"id": 131, "drivers": ["Michael Schumacher", "Nico Rosberg"]},
        "Renault":        {"id": 4,   "drivers": ["Robert Kubica", "Vitaly Petrov"]},
        "Williams":       {"id": 3,   "drivers": ["Rubens Barrichello", "Nico Hülkenberg"]},
        "Force India":    {"id": 21,  "drivers": ["Adrian Sutil", "Vitantonio Liuzzi"]},
        "Sauber":         {"id": 15,  "drivers": ["Kamui Kobayashi", "Pedro de la Rosa"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Sebastien Buemi", "Jaime Alguersuari"]},
        "Lotus":          {"id": 210, "drivers": ["Jarno Trulli", "Timo Glock"]},
    },
    2011: {
        "Red Bull":       {"id": 9,   "drivers": ["Sebastian Vettel", "Mark Webber"]},
        "McLaren":        {"id": 1,   "drivers": ["Lewis Hamilton", "Jenson Button"]},
        "Ferrari":        {"id": 6,   "drivers": ["Fernando Alonso", "Felipe Massa"]},
        "Mercedes":       {"id": 131, "drivers": ["Michael Schumacher", "Nico Rosberg"]},
        "Renault":        {"id": 4,   "drivers": ["Nick Heidfeld", "Vitaly Petrov"]},
        "Williams":       {"id": 3,   "drivers": ["Rubens Barrichello", "Pastor Maldonado"]},
        "Force India":    {"id": 21,  "drivers": ["Adrian Sutil", "Paul di Resta"]},
        "Sauber":         {"id": 15,  "drivers": ["Kamui Kobayashi", "Sergio Perez"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Sebastien Buemi", "Jaime Alguersuari"]},
        "Lotus":          {"id": 210, "drivers": ["Jarno Trulli", "Heikki Kovalainen"]},
    },
    2012: {
        "Red Bull":       {"id": 9,   "drivers": ["Sebastian Vettel", "Mark Webber"]},
        "McLaren":        {"id": 1,   "drivers": ["Lewis Hamilton", "Jenson Button"]},
        "Ferrari":        {"id": 6,   "drivers": ["Fernando Alonso", "Felipe Massa"]},
        "Mercedes":       {"id": 131, "drivers": ["Michael Schumacher", "Nico Rosberg"]},
        "Lotus":          {"id": 214, "drivers": ["Kimi Räikkönen", "Romain Grosjean"]},
        "Sauber":         {"id": 15,  "drivers": ["Kamui Kobayashi", "Sergio Perez"]},
        "Force India":    {"id": 21,  "drivers": ["Nico Hülkenberg", "Paul di Resta"]},
        "Williams":       {"id": 3,   "drivers": ["Pastor Maldonado", "Bruno Senna"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Daniel Ricciardo", "Jean-Eric Vergne"]},
        "Caterham":       {"id": 210, "drivers": ["Heikki Kovalainen", "Vitaly Petrov"]},
    },
    2013: {
        "Red Bull":       {"id": 9,   "drivers": ["Sebastian Vettel", "Mark Webber"]},
        "Ferrari":        {"id": 6,   "drivers": ["Fernando Alonso", "Felipe Massa"]},
        "McLaren":        {"id": 1,   "drivers": ["Jenson Button", "Sergio Perez"]},
        "Mercedes":       {"id": 131, "drivers": ["Nico Rosberg", "Lewis Hamilton"]},
        "Lotus":          {"id": 214, "drivers": ["Kimi Räikkönen", "Romain Grosjean"]},
        "Force India":    {"id": 21,  "drivers": ["Adrian Sutil", "Paul di Resta"]},
        "Sauber":         {"id": 15,  "drivers": ["Nico Hülkenberg", "Esteban Gutierrez"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Daniel Ricciardo", "Jean-Eric Vergne"]},
        "Williams":       {"id": 3,   "drivers": ["Pastor Maldonado", "Valtteri Bottas"]},
        "Caterham":       {"id": 210, "drivers": ["Charles Pic", "Giedo van der Garde"]},
    },
    2014: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Nico Rosberg"]},
        "Red Bull":       {"id": 9,   "drivers": ["Sebastian Vettel", "Daniel Ricciardo"]},
        "Ferrari":        {"id": 6,   "drivers": ["Fernando Alonso", "Kimi Räikkönen"]},
        "McLaren":        {"id": 1,   "drivers": ["Jenson Button", "Kevin Magnussen"]},
        "Force India":    {"id": 21,  "drivers": ["Nico Hülkenberg", "Sergio Perez"]},
        "Williams":       {"id": 3,   "drivers": ["Valtteri Bottas", "Felipe Massa"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Jean-Eric Vergne", "Daniil Kvyat"]},
        "Lotus":          {"id": 214, "drivers": ["Romain Grosjean", "Pastor Maldonado"]},
        "Sauber":         {"id": 15,  "drivers": ["Esteban Gutierrez", "Adrian Sutil"]},
        "Marussia":       {"id": 213, "drivers": ["Jules Bianchi", "Max Chilton"]},
    },
    2015: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Nico Rosberg"]},
        "Ferrari":        {"id": 6,   "drivers": ["Sebastian Vettel", "Kimi Räikkönen"]},
        "Williams":       {"id": 3,   "drivers": ["Valtteri Bottas", "Felipe Massa"]},
        "Red Bull":       {"id": 9,   "drivers": ["Daniil Kvyat", "Daniel Ricciardo"]},
        "Force India":    {"id": 21,  "drivers": ["Nico Hülkenberg", "Sergio Perez"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Carlos Sainz", "Max Verstappen"]},
        "Lotus":          {"id": 214, "drivers": ["Romain Grosjean", "Pastor Maldonado"]},
        "McLaren":        {"id": 1,   "drivers": ["Jenson Button", "Fernando Alonso"]},
        "Sauber":         {"id": 15,  "drivers": ["Felipe Nasr", "Marcus Ericsson"]},
        "Manor":          {"id": 213, "drivers": ["Will Stevens", "Roberto Merhi"]},
    },
    2016: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Nico Rosberg"]},
        "Ferrari":        {"id": 6,   "drivers": ["Sebastian Vettel", "Kimi Räikkönen"]},
        "Red Bull":       {"id": 9,   "drivers": ["Daniel Ricciardo", "Max Verstappen"]},
        "Force India":    {"id": 21,  "drivers": ["Nico Hülkenberg", "Sergio Perez"]},
        "Williams":       {"id": 3,   "drivers": ["Valtteri Bottas", "Felipe Massa"]},
        "McLaren":        {"id": 1,   "drivers": ["Jenson Button", "Fernando Alonso"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Carlos Sainz", "Daniil Kvyat"]},
        "Haas":           {"id": 211, "drivers": ["Romain Grosjean", "Esteban Gutierrez"]},
        "Renault":        {"id": 4,   "drivers": ["Kevin Magnussen", "Jolyon Palmer"]},
        "Sauber":         {"id": 15,  "drivers": ["Felipe Nasr", "Marcus Ericsson"]},
    },
    2017: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Valtteri Bottas"]},
        "Ferrari":        {"id": 6,   "drivers": ["Sebastian Vettel", "Kimi Räikkönen"]},
        "Red Bull":       {"id": 9,   "drivers": ["Daniel Ricciardo", "Max Verstappen"]},
        "Force India":    {"id": 21,  "drivers": ["Nico Hülkenberg", "Sergio Perez"]},
        "Williams":       {"id": 3,   "drivers": ["Lance Stroll", "Felipe Massa"]},
        "Renault":        {"id": 4,   "drivers": ["Nico Hülkenberg", "Jolyon Palmer"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Carlos Sainz", "Daniil Kvyat"]},
        "Haas":           {"id": 211, "drivers": ["Romain Grosjean", "Kevin Magnussen"]},
        "McLaren":        {"id": 1,   "drivers": ["Fernando Alonso", "Stoffel Vandoorne"]},
        "Sauber":         {"id": 15,  "drivers": ["Marcus Ericsson", "Pascal Wehrlein"]},
    },
    2018: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Valtteri Bottas"]},
        "Ferrari":        {"id": 6,   "drivers": ["Sebastian Vettel", "Kimi Räikkönen"]},
        "Red Bull":       {"id": 9,   "drivers": ["Daniel Ricciardo", "Max Verstappen"]},
        "Renault":        {"id": 4,   "drivers": ["Carlos Sainz", "Nico Hülkenberg"]},
        "Haas":           {"id": 211, "drivers": ["Romain Grosjean", "Kevin Magnussen"]},
        "McLaren":        {"id": 1,   "drivers": ["Fernando Alonso", "Stoffel Vandoorne"]},
        "Force India":    {"id": 21,  "drivers": ["Esteban Ocon", "Sergio Perez"]},
        "Sauber":         {"id": 15,  "drivers": ["Charles Leclerc", "Marcus Ericsson"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Pierre Gasly", "Brendon Hartley"]},
        "Williams":       {"id": 3,   "drivers": ["Lance Stroll", "Sergey Sirotkin"]},
    },
    2019: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Valtteri Bottas"]},
        "Ferrari":        {"id": 6,   "drivers": ["Sebastian Vettel", "Charles Leclerc"]},
        "Red Bull":       {"id": 9,   "drivers": ["Max Verstappen", "Pierre Gasly"]},
        "McLaren":        {"id": 1,   "drivers": ["Carlos Sainz", "Lando Norris"]},
        "Renault":        {"id": 4,   "drivers": ["Daniel Ricciardo", "Nico Hülkenberg"]},
        "Toro Rosso":     {"id": 5,   "drivers": ["Daniil Kvyat", "Alexander Albon"]},
        "Racing Point":   {"id": 21,  "drivers": ["Sergio Perez", "Lance Stroll"]},
        "Alfa Romeo":     {"id": 15,  "drivers": ["Kimi Räikkönen", "Antonio Giovinazzi"]},
        "Haas":           {"id": 211, "drivers": ["Romain Grosjean", "Kevin Magnussen"]},
        "Williams":       {"id": 3,   "drivers": ["George Russell", "Robert Kubica"]},
    },
    2020: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Valtteri Bottas"]},
        "Red Bull":       {"id": 9,   "drivers": ["Max Verstappen", "Alexander Albon"]},
        "Ferrari":        {"id": 6,   "drivers": ["Sebastian Vettel", "Charles Leclerc"]},
        "McLaren":        {"id": 1,   "drivers": ["Lando Norris", "Carlos Sainz"]},
        "Racing Point":   {"id": 21,  "drivers": ["Sergio Perez", "Lance Stroll"]},
        "Renault":        {"id": 4,   "drivers": ["Daniel Ricciardo", "Esteban Ocon"]},
        "AlphaTauri":     {"id": 5,   "drivers": ["Pierre Gasly", "Daniil Kvyat"]},
        "Alfa Romeo":     {"id": 15,  "drivers": ["Kimi Räikkönen", "Antonio Giovinazzi"]},
        "Haas":           {"id": 211, "drivers": ["Romain Grosjean", "Kevin Magnussen"]},
        "Williams":       {"id": 3,   "drivers": ["George Russell", "Nicholas Latifi"]},
    },
    2021: {
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "Valtteri Bottas"]},
        "Red Bull":       {"id": 9,   "drivers": ["Max Verstappen", "Sergio Perez"]},
        "Ferrari":        {"id": 6,   "drivers": ["Charles Leclerc", "Carlos Sainz"]},
        "McLaren":        {"id": 1,   "drivers": ["Lando Norris", "Daniel Ricciardo"]},
        "Alpine":         {"id": 214, "drivers": ["Fernando Alonso", "Esteban Ocon"]},
        "AlphaTauri":     {"id": 5,   "drivers": ["Pierre Gasly", "Yuki Tsunoda"]},
        "Aston Martin":   {"id": 117, "drivers": ["Sebastian Vettel", "Lance Stroll"]},
        "Williams":       {"id": 3,   "drivers": ["George Russell", "Nicholas Latifi"]},
        "Alfa Romeo":     {"id": 15,  "drivers": ["Kimi Räikkönen", "Antonio Giovinazzi"]},
        "Haas":           {"id": 211, "drivers": ["Mick Schumacher", "Nikita Mazepin"]},
    },
    2022: {
        "Red Bull":       {"id": 9,   "drivers": ["Max Verstappen", "Sergio Perez"]},
        "Ferrari":        {"id": 6,   "drivers": ["Charles Leclerc", "Carlos Sainz"]},
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "George Russell"]},
        "Alpine":         {"id": 214, "drivers": ["Fernando Alonso", "Esteban Ocon"]},
        "McLaren":        {"id": 1,   "drivers": ["Lando Norris", "Daniel Ricciardo"]},
        "Alfa Romeo":     {"id": 15,  "drivers": ["Valtteri Bottas", "Zhou Guanyu"]},
        "Aston Martin":   {"id": 117, "drivers": ["Sebastian Vettel", "Lance Stroll"]},
        "Haas":           {"id": 211, "drivers": ["Kevin Magnussen", "Mick Schumacher"]},
        "AlphaTauri":     {"id": 5,   "drivers": ["Pierre Gasly", "Yuki Tsunoda"]},
        "Williams":       {"id": 3,   "drivers": ["Alex Albon", "Nicholas Latifi"]},
    },
    2023: {
        "Red Bull":       {"id": 9,   "drivers": ["Max Verstappen", "Sergio Perez"]},
        "Aston Martin":   {"id": 117, "drivers": ["Fernando Alonso", "Lance Stroll"]},
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "George Russell"]},
        "Ferrari":        {"id": 6,   "drivers": ["Charles Leclerc", "Carlos Sainz"]},
        "McLaren":        {"id": 1,   "drivers": ["Lando Norris", "Oscar Piastri"]},
        "Alpine":         {"id": 214, "drivers": ["Esteban Ocon", "Pierre Gasly"]},
        "Williams":       {"id": 3,   "drivers": ["Alex Albon", "Logan Sargeant"]},
        "AlphaTauri":     {"id": 5,   "drivers": ["Yuki Tsunoda", "Liam Lawson"]},
        "Alfa Romeo":     {"id": 15,  "drivers": ["Valtteri Bottas", "Zhou Guanyu"]},
        "Haas":           {"id": 211, "drivers": ["Kevin Magnussen", "Nico Hülkenberg"]},
    },
    2024: {
        "Red Bull":       {"id": 9,   "drivers": ["Max Verstappen", "Sergio Perez"]},
        "Ferrari":        {"id": 6,   "drivers": ["Charles Leclerc", "Carlos Sainz"]},
        "McLaren":        {"id": 1,   "drivers": ["Lando Norris", "Oscar Piastri"]},
        "Mercedes":       {"id": 131, "drivers": ["Lewis Hamilton", "George Russell"]},
        "Aston Martin":   {"id": 117, "drivers": ["Fernando Alonso", "Lance Stroll"]},
        "Alpine":         {"id": 214, "drivers": ["Esteban Ocon", "Pierre Gasly"]},
        "Williams":       {"id": 3,   "drivers": ["Alex Albon", "Franco Colapinto"]},
        "RB (AlphaTauri)":{"id": 5,   "drivers": ["Yuki Tsunoda", "Liam Lawson"]},
        "Kick Sauber":    {"id": 15,  "drivers": ["Valtteri Bottas", "Zhou Guanyu"]},
        "Haas":           {"id": 211, "drivers": ["Kevin Magnussen", "Nico Hülkenberg"]},
    },
}

def get_era(y: int) -> int:
    if y <= 2013: return 0
    elif y <= 2016: return 1
    elif y <= 2021: return 2
    return 3

def get_driver_circuit_stats(race_data_df: pd.DataFrame, circuit_id: int, constructor_id: int, year: int) -> Tuple[Optional[float], Optional[float]]:
    cid_col = "circuitId" if "circuitId" in race_data_df.columns else \
              "circuit_id" if "circuit_id" in race_data_df.columns else None

    if cid_col is None:
        mask = (
            (race_data_df["constructorId"] == constructor_id) &
            (race_data_df["year"] == year)
        )
        subset = race_data_df[mask]
    else:
        mask = (
            (race_data_df[cid_col] == circuit_id) &
            (race_data_df["constructorId"] == constructor_id) &
            (race_data_df["year"] == year)
        )
        subset = race_data_df[mask]
        if len(subset) < 3:
            subset = race_data_df[race_data_df[cid_col] == circuit_id]

    if len(subset) < 3:
        return None, None

    pace = float(subset["rolling_avg_pace"].median())
    deg  = float(subset["lap_degradation"].median()) if "lap_degradation" in subset.columns else 0.06
    return pace, deg
