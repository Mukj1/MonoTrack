#!/usr/bin/env python3
import json
import math
import sys
from datetime import datetime

EARTH_RADIUS_METERS = 6371000
ELEVATION_NOISE_FLOOR_METERS = 1.0
MOVING_SPEED_THRESHOLD_KMH = 0.5
MOVING_DISTANCE_THRESHOLD_METERS = 2.0


def parse_time(value):
    if not value:
        return None
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def distance_meters(a, b):
    lat1 = math.radians(float(a["lat"]))
    lat2 = math.radians(float(b["lat"]))
    d_lat = math.radians(float(b["lat"]) - float(a["lat"]))
    d_lon = math.radians(float(b["lon"]) - float(a["lon"]))
    hav = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return EARTH_RADIUS_METERS * 2 * math.atan2(math.sqrt(hav), math.sqrt(1 - hav))


def elevation_gain(points):
    elevations = []
    for point in points:
        ele = point.get("ele")
        if isinstance(ele, (int, float)) and math.isfinite(ele):
            elevations.append(float(ele))

    if len(elevations) < 2:
        return 0

    gain = 0
    baseline = elevations[0]
    pending_gain = 0

    for ele in elevations[1:]:
        delta = ele - baseline
        if delta > 0:
            pending_gain += delta
            baseline = ele
        elif abs(delta) >= ELEVATION_NOISE_FLOOR_METERS:
            gain += pending_gain
            pending_gain = 0
            baseline = ele

    return gain + pending_gain


def moving_stats(points, fallback_duration, fallback_distance):
    moving_seconds = 0
    moving_distance = 0
    for previous, current in zip(points, points[1:]):
        previous_time = parse_time(previous.get("time"))
        current_time = parse_time(current.get("time"))
        if not previous_time or not current_time:
            continue

        seconds = (current_time - previous_time).total_seconds()
        if seconds <= 0:
            continue

        distance = distance_meters(previous, current)
        speed_kmh = (distance / 1000) / (seconds / 3600)
        if distance >= MOVING_DISTANCE_THRESHOLD_METERS and speed_kmh >= MOVING_SPEED_THRESHOLD_KMH:
            moving_seconds += seconds
            moving_distance += distance

    if moving_seconds > 0:
        return moving_seconds, moving_distance
    return fallback_duration, fallback_distance


def enhance(activity):
    points = [
        point
        for point in activity.get("path", [])
        if isinstance(point.get("lat"), (int, float))
        and isinstance(point.get("lon"), (int, float))
        and math.isfinite(point["lat"])
        and math.isfinite(point["lon"])
    ]

    if not points:
        return activity

    distance = 0
    for previous, current in zip(points, points[1:]):
        distance += distance_meters(previous, current)

    start_time = parse_time(points[0].get("time")) or parse_time(activity.get("startTime"))
    end_time = parse_time(points[-1].get("time")) or start_time
    duration = 0
    if start_time and end_time:
        duration = max(0, (end_time - start_time).total_seconds())

    elevations = [
        float(point["ele"])
        for point in points
        if isinstance(point.get("ele"), (int, float)) and math.isfinite(point["ele"])
    ]

    stats = dict(activity.get("stats") or {})
    moving_seconds, moving_distance = moving_stats(points, duration, distance)
    stats["distance"] = distance
    stats["duration"] = duration
    stats["movingDuration"] = moving_seconds
    stats["avgSpeed"] = (moving_distance / 1000) / (moving_seconds / 3600) if moving_seconds > 0 else 0
    stats["maxEle"] = max(elevations) if elevations else 0
    stats["minEle"] = min(elevations) if elevations else 0
    computed_gain = elevation_gain(points)
    source_gain = stats.get("elevationGain")
    if isinstance(source_gain, (int, float)) and math.isfinite(source_gain) and source_gain > 0:
        stats["elevationGain"] = max(computed_gain, float(source_gain))
    else:
        stats["elevationGain"] = computed_gain

    activity["stats"] = stats
    activity["path"] = points
    if start_time:
        activity["startTime"] = start_time.isoformat().replace("+00:00", "Z")

    return activity


def main():
    payload = json.load(sys.stdin)
    activities = payload.get("activities") or []
    print(json.dumps({"activities": [enhance(activity) for activity in activities]}, separators=(",", ":")))


if __name__ == "__main__":
    main()
