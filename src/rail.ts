const MINIMUM_WAYPOINTS = 2;

export interface Point {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface RailSample {
  readonly position: Point;
  readonly direction: Point;
}

export interface Rail {
  readonly length: number;
  readonly sampleAt: (distance: number) => RailSample;
  readonly advance: (distance: number, step: number) => number;
  readonly hasEnded: (distance: number) => boolean;
}

interface Segment {
  readonly start: Point;
  readonly direction: Point;
  readonly startDistance: number;
  readonly length: number;
}

function buildSegments(waypoints: readonly Point[]): Segment[] {
  if (waypoints.length < MINIMUM_WAYPOINTS) {
    throw new Error("A rail needs at least two waypoints");
  }
  const segments: Segment[] = [];
  let startDistance = 0;
  waypoints.forEach((end, index) => {
    const start = waypoints[index - 1];
    if (start === undefined) {
      return;
    }
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dy, dz);
    if (length === 0) {
      throw new Error("Consecutive rail waypoints must differ");
    }
    segments.push({
      start,
      direction: { x: dx / length, y: dy / length, z: dz / length },
      startDistance,
      length,
    });
    startDistance += length;
  });
  return segments;
}

export function createRail(waypoints: readonly Point[]): Rail {
  const segments = buildSegments(waypoints);
  const length = segments.reduce((total, segment) => total + segment.length, 0);

  function clamp(distance: number): number {
    return Math.min(length, Math.max(0, distance));
  }

  function sampleAt(distance: number): RailSample {
    const clamped = clamp(distance);
    let current = segments[0];
    for (const segment of segments) {
      if (segment.startDistance <= clamped) {
        current = segment;
      }
    }
    if (current === undefined) {
      throw new Error("A rail needs at least one segment");
    }
    const travelled = clamped - current.startDistance;
    const { start, direction } = current;
    return {
      position: {
        x: start.x + direction.x * travelled,
        y: start.y + direction.y * travelled,
        z: start.z + direction.z * travelled,
      },
      direction,
    };
  }

  return {
    length,
    sampleAt,
    advance: (distance, step) => clamp(distance + step),
    hasEnded: (distance) => distance >= length,
  };
}
