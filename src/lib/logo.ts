import { SVG } from '@svgdotjs/svg.js';

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

const ANGLE_1 = 25;
const ANGLE_2 = 125;
const ANGLE_OFFSET = Math.abs(ANGLE_1 - ANGLE_2) - 90;

const SIN_ANGLE_1 = Math.sin(degToRad(ANGLE_1));
const COS_ANGLE_1 = Math.cos(degToRad(ANGLE_1));

const SIN_ANGLE_2 = Math.sin(degToRad(ANGLE_2));
const COS_ANGLE_2 = Math.cos(degToRad(ANGLE_2));

const BOX_SIZE = 6.6;
const BOX_SIZE_PX = 500;
const STROKE_WIDTH = 0.2;
const HALF_STROKE_WIDTH = STROKE_WIDTH / 2;

const SMALL_CIRCLE_RADIUS = 1;
const LARGE_CIRCLE_RADIUS = 1.7;
const ARC_CIRCLE_RADIUS = 0.3;
const ARC_CIRCLE_OFFSET = 0.3;

const MAIN_CIRCLE_CENTER = { x: 4.624934205431529, y: 3.90889030329 };

let t1 = (ARC_CIRCLE_RADIUS * (COS_ANGLE_2 - COS_ANGLE_1)) / Math.cos(degToRad(ANGLE_OFFSET));

const CONNECTORS_INTERSECTIONS = [
  {
    x: MAIN_CIRCLE_CENTER.x - t1,
    y: MAIN_CIRCLE_CENTER.y + (t1 * SIN_ANGLE_1) / COS_ANGLE_1 + ARC_CIRCLE_RADIUS / COS_ANGLE_1,
  },
  {
    x: MAIN_CIRCLE_CENTER.x + t1,
    y: MAIN_CIRCLE_CENTER.y - (t1 * SIN_ANGLE_1) / COS_ANGLE_1 - ARC_CIRCLE_RADIUS / COS_ANGLE_1,
  },
];

const WIDTH_OFFSET = (BOX_SIZE - MAIN_CIRCLE_CENTER.x - LARGE_CIRCLE_RADIUS) / 2;
// const WIDTH_OFFSET = 0;

const CIRCLE_ONE_DISTANCE = { min: 2.8, max: 4 };
const CIRCLE_TWO_DISTANCE = { min: 2.8, max: 3.55 };

let draw = SVG().addTo('#app').viewbox(0, 0, BOX_SIZE, BOX_SIZE).size(BOX_SIZE_PX, BOX_SIZE_PX);

let d1 = CIRCLE_ONE_DISTANCE.max;
let d2 = CIRCLE_TWO_DISTANCE.max;

let p1 = [
  MAIN_CIRCLE_CENTER.x + (d2 - ARC_CIRCLE_OFFSET) * COS_ANGLE_2 + ARC_CIRCLE_RADIUS * SIN_ANGLE_2,
  MAIN_CIRCLE_CENTER.y - (d2 - ARC_CIRCLE_OFFSET) * SIN_ANGLE_2 + ARC_CIRCLE_RADIUS * COS_ANGLE_2,
];

let p2 = [
  MAIN_CIRCLE_CENTER.x + (d2 - ARC_CIRCLE_OFFSET) * COS_ANGLE_2 - ARC_CIRCLE_RADIUS * SIN_ANGLE_2,
  MAIN_CIRCLE_CENTER.y - (d2 - ARC_CIRCLE_OFFSET) * SIN_ANGLE_2 - ARC_CIRCLE_RADIUS * COS_ANGLE_2,
];

let p3 = [
  MAIN_CIRCLE_CENTER.x - (d1 - ARC_CIRCLE_OFFSET) * COS_ANGLE_1 - ARC_CIRCLE_RADIUS * SIN_ANGLE_1,
  MAIN_CIRCLE_CENTER.y + (d1 - ARC_CIRCLE_OFFSET) * SIN_ANGLE_1 - ARC_CIRCLE_RADIUS * COS_ANGLE_1,
];

let p4 = [
  MAIN_CIRCLE_CENTER.x - (d1 - ARC_CIRCLE_OFFSET) * COS_ANGLE_1 + ARC_CIRCLE_RADIUS * SIN_ANGLE_1,
  MAIN_CIRCLE_CENTER.y + (d1 - ARC_CIRCLE_OFFSET) * SIN_ANGLE_1 + ARC_CIRCLE_RADIUS * COS_ANGLE_1,
];

let connectorPath = `M ${WIDTH_OFFSET + CONNECTORS_INTERSECTIONS[0].x} ${CONNECTORS_INTERSECTIONS[0].y}`;
connectorPath += ` L ${WIDTH_OFFSET + p1[0]} ${p1[1]}`;
connectorPath += ` A ${ARC_CIRCLE_RADIUS} ${ARC_CIRCLE_RADIUS} 0 0 0 ${WIDTH_OFFSET + p2[0]} ${p2[1]}`;
connectorPath += ` L ${WIDTH_OFFSET + CONNECTORS_INTERSECTIONS[1].x} ${CONNECTORS_INTERSECTIONS[1].y}`;
connectorPath += ` L ${WIDTH_OFFSET + p3[0]} ${p3[1]}`;
connectorPath += ` A ${ARC_CIRCLE_RADIUS} ${ARC_CIRCLE_RADIUS} 0 0 0 ${WIDTH_OFFSET + p4[0]} ${p4[1]}`;
connectorPath += ` Z`;

const mainCircleAttribs = {
  'cx': WIDTH_OFFSET + MAIN_CIRCLE_CENTER.x,
  'cy': MAIN_CIRCLE_CENTER.y,
  'r': LARGE_CIRCLE_RADIUS - HALF_STROKE_WIDTH,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
};

const circleOneAttribs = {
  'r': SMALL_CIRCLE_RADIUS - HALF_STROKE_WIDTH,
  'cx': WIDTH_OFFSET + MAIN_CIRCLE_CENTER.x - d1 * COS_ANGLE_1,
  'cy': MAIN_CIRCLE_CENTER.y + d1 * SIN_ANGLE_1,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
};

const circleTwoAttribs = {
  'r': SMALL_CIRCLE_RADIUS - HALF_STROKE_WIDTH,
  'cx': WIDTH_OFFSET + MAIN_CIRCLE_CENTER.x + d2 * COS_ANGLE_2,
  'cy': MAIN_CIRCLE_CENTER.y - d2 * SIN_ANGLE_2,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
};

const connectorAttribs = {
  'd': connectorPath,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
};

let mainCircle = draw
  .circle()
  .attr(mainCircleAttribs)
  .maskWith(
    draw
      .mask()
      .add(draw.circle().attr({ ...mainCircleAttribs, stroke: 'white' }))
      .add(draw.path().attr({ ...connectorAttribs, 'fill': 'black', 'stroke-width': HALF_STROKE_WIDTH })),
  );

let circle1 = draw
  .circle()
  .attr(circleOneAttribs)
  .maskWith(
    draw
      .mask()
      .add(draw.circle().attr({ ...circleOneAttribs, stroke: 'white' }))
      .add(draw.path().attr({ ...connectorAttribs, 'fill': 'black', 'stroke-width': HALF_STROKE_WIDTH })),
  );

let circle2 = draw
  .circle()
  .attr(circleTwoAttribs)
  .maskWith(
    draw
      .mask()
      .add(draw.circle().attr({ ...circleTwoAttribs, stroke: 'white' }))
      .add(draw.path().attr({ ...connectorAttribs, 'fill': 'black', 'stroke-width': HALF_STROKE_WIDTH })),
  );

let connector = draw
  .path()
  .attr(connectorAttribs)
  .maskWith(
    draw
      .mask()
      .add(draw.path().attr({ ...connectorAttribs, stroke: 'white' }))
      .add(draw.circle().attr({ ...mainCircleAttribs, 'fill': 'black', 'stroke': 'white', 'stroke-width': 0.2 })),
  );
