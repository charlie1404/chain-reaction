import { SVG } from '@svgdotjs/svg.js';

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

// 6.6 - 6.3252311481;
// 0.2747688519;
// 0.137384426;

const BOX_SIZE = 6.6;
const BOX_SIZE_PX = 600;
const STROKE_WIDTH = 0.2;
const HALF_STROKE_WIDTH = STROKE_WIDTH / 2;

const SMALL_CIRCLE_RADIUS = 1;
const LARGE_CIRCLE_RADIUS = 1.7;

const CIRCLE_ONE_TWO_DISTANCE = 4;
const CIRCLE_TWO_THREE_DISTANCE = 3.55;

const ARC_CIRCLE_RADIUS = 0.3;
const ARC_OFFSET = 0.55;

const LOWER_SEGMENT_LENGTH = CIRCLE_ONE_TWO_DISTANCE - LARGE_CIRCLE_RADIUS - ARC_OFFSET + HALF_STROKE_WIDTH;
const UPPER_SEGMENT_LENGTH = CIRCLE_TWO_THREE_DISTANCE - LARGE_CIRCLE_RADIUS - ARC_OFFSET + HALF_STROKE_WIDTH;

const SIN_25 = Math.sin(degToRad(25));
const COS_25 = Math.cos(degToRad(25));

const SIN_125 = Math.sin(degToRad(125));
const COS_125 = Math.cos(degToRad(125));

const CIRCLE_ONE_X = 1;
const CIRCLE_ONE_Y = 1;

const CIRCLE_TWO_X = CIRCLE_ONE_TWO_DISTANCE * COS_25 + CIRCLE_ONE_X;
const CIRCLE_TWO_Y = CIRCLE_ONE_TWO_DISTANCE * SIN_25 + CIRCLE_ONE_X;

const CIRCLE_THREE_X = CIRCLE_TWO_THREE_DISTANCE * COS_125 + CIRCLE_TWO_X;
const CIRCLE_THREE_Y = CIRCLE_TWO_THREE_DISTANCE * SIN_125 + CIRCLE_TWO_Y;

// const WIDTH_OFFSET = (BOX_SIZE - CIRCLE_TWO_X - LARGE_CIRCLE_RADIUS) / 2;
const WIDTH_OFFSET = 0;

let draw = SVG().addTo('#app').viewbox(0, 0, BOX_SIZE, BOX_SIZE).size(BOX_SIZE_PX, BOX_SIZE_PX);

let circle1 = draw.circle().attr({
  'r': SMALL_CIRCLE_RADIUS - STROKE_WIDTH / 2,
  'cx': WIDTH_OFFSET + CIRCLE_ONE_X,
  'cy': BOX_SIZE - CIRCLE_ONE_Y,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
});

let circle2 = draw.circle().attr({
  'r': LARGE_CIRCLE_RADIUS - STROKE_WIDTH / 2,
  'cx': WIDTH_OFFSET + CIRCLE_TWO_X,
  'cy': BOX_SIZE - CIRCLE_TWO_Y,
  'fill': 'none',
  'stroke': 'yellow',
  'stroke-width': STROKE_WIDTH,
});

let circle3 = draw.circle().attr({
  'r': SMALL_CIRCLE_RADIUS - STROKE_WIDTH / 2,
  'cx': WIDTH_OFFSET + CIRCLE_THREE_X,
  'cy': BOX_SIZE - CIRCLE_THREE_Y,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
});

let arc1StartX = CIRCLE_ONE_X + ARC_OFFSET * COS_25 + ARC_CIRCLE_RADIUS * SIN_25;
let arc1StartY = CIRCLE_ONE_Y + ARC_OFFSET * SIN_25 - ARC_CIRCLE_RADIUS * COS_25;
let arc1EndX = CIRCLE_ONE_X + ARC_OFFSET * COS_25 - ARC_CIRCLE_RADIUS * SIN_25;
let arc1EndY = CIRCLE_ONE_Y + ARC_OFFSET * SIN_25 + ARC_CIRCLE_RADIUS * COS_25;

let path1M = [arc1StartX + LOWER_SEGMENT_LENGTH * COS_25, arc1StartY + LOWER_SEGMENT_LENGTH * SIN_25];
let path1L1 = [arc1StartX, arc1StartY];
let path1Arc1 = [arc1EndX, arc1EndY];
let path1L2 = [arc1EndX + LOWER_SEGMENT_LENGTH * COS_25, arc1EndY + LOWER_SEGMENT_LENGTH * SIN_25];

let path1 = `M ${WIDTH_OFFSET + path1M[0]} ${BOX_SIZE - path1M[1]}`;
path1 += ` L ${WIDTH_OFFSET + path1L1[0]} ${BOX_SIZE - path1L1[1]}`;
path1 += ` A ${ARC_CIRCLE_RADIUS} ${ARC_CIRCLE_RADIUS} 0 0 1 ${WIDTH_OFFSET + path1Arc1[0]} ${BOX_SIZE - path1Arc1[1]}`;
path1 += ` L ${WIDTH_OFFSET + path1L2[0]} ${BOX_SIZE - path1L2[1]}`;

let arc2StartX = CIRCLE_THREE_X - ARC_OFFSET * COS_125 - ARC_CIRCLE_RADIUS * SIN_125;
let arc2StartY = CIRCLE_THREE_Y - ARC_OFFSET * SIN_125 + ARC_CIRCLE_RADIUS * COS_125;
let arc2EndX = CIRCLE_THREE_X - ARC_OFFSET * COS_125 + ARC_CIRCLE_RADIUS * SIN_125;
let arc2EndY = CIRCLE_THREE_Y - ARC_OFFSET * SIN_125 - ARC_CIRCLE_RADIUS * COS_125;

let path2M = [arc2StartX - UPPER_SEGMENT_LENGTH * COS_125, arc2StartY - UPPER_SEGMENT_LENGTH * SIN_125];
let path2L1 = [arc2StartX, arc2StartY];
let path2Arc1 = [arc2EndX, arc2EndY];
let path2L2 = [arc2EndX - UPPER_SEGMENT_LENGTH * COS_125, arc2EndY - UPPER_SEGMENT_LENGTH * SIN_125];

let path2 = `M ${WIDTH_OFFSET + path2M[0]} ${BOX_SIZE - path2M[1]}`;
path2 += ` L ${WIDTH_OFFSET + path2L1[0]} ${BOX_SIZE - path2L1[1]}`;
path2 += ` A ${ARC_CIRCLE_RADIUS} ${ARC_CIRCLE_RADIUS} 0 0 1 ${WIDTH_OFFSET + path2Arc1[0]} ${BOX_SIZE - path2Arc1[1]}`;
path2 += ` L ${WIDTH_OFFSET + path2L2[0]} ${BOX_SIZE - path2L2[1]}`;

let connectorPath1 = draw.path().attr({
  'd': path1,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
});

let connectorPath2 = draw.path().attr({
  'd': path2,
  'fill': 'none',
  'stroke': 'black',
  'stroke-width': STROKE_WIDTH,
});
