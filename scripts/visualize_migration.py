import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

# Get the directory of the script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "ts_migration_stats.csv")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "ts_migration_graph.png")

# Read the data
try:
    df = pd.read_csv(CSV_PATH)
except FileNotFoundError:
    print(f"Error: {CSV_PATH} not found.")
    print("Please run ts_migration_stats.sh first to generate the data.")
    exit(1)

# Convert date column to datetime objects
df["date"] = pd.to_datetime(df["date"])

# Group by date and get the last entry for each day to handle multiple commits
df = df.groupby("date").tail(1)

# Set date as index
df = df.set_index("date")

# Calculate total files and TS percentage
df["total_files"] = df["js_files"] + df["ts_files"]
df["ts_percentage"] = (df["ts_files"] / df["total_files"] * 100).fillna(0)

# Create the plot
fig, ax1 = plt.subplots(figsize=(12, 7))

# Plot JS and TS file counts as a stacked area chart
ax1.stackplot(
    df.index,
    df["js_files"],
    df["ts_files"],
    labels=["JavaScript", "TypeScript"],
    colors=["#f1e05a", "#2b7489"],
    alpha=0.7
)

ax1.set_xlabel("Date")
ax1.set_ylabel("Number of Files")
ax1.set_title("JavaScript to TypeScript Migration Over Time")
ax1.legend(loc="upper left")
ax1.grid(True, linestyle="--", alpha=0.6)

# Create a second y-axis for the percentage
ax2 = ax1.twinx()
ax2.plot(
    df.index,
    df["ts_percentage"],
    color="#3178c6",
    linestyle="--",
    linewidth=2,
    label="TypeScript %"
)
ax2.set_ylabel("TypeScript Percentage (%)")
ax2.set_ylim(0, 100)
ax2.legend(loc="upper right")

# Format the date axis
fig.autofmt_xdate()
ax1.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=3))

# Save the figure
plt.tight_layout()
plt.savefig(OUTPUT_PATH)

print(f"Graph saved to {OUTPUT_PATH}")