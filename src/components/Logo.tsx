import { chakra } from '@chakra-ui/react';

function GameLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 6.6 6.6"
      width="400"
      preserveAspectRatio="xMinYMin"
    >
      <chakra.path
        animation={`logoTextKeyFrameAnim 8s ease-in-out forwards`}
        d="M 5.213 4.03 L 3.144 1.075 A 0.3 0.3 0 0 0 2.653 1.419 L 4.312 3.788 L 1.282 5.2 A 0.3 0.3 0 0 0 1.536 5.744 Z"
        fill="none"
        stroke="white"
        strokeWidth="0.15"
        strokeDasharray="1600"
        strokeDashoffset="1600"
      />
      <circle r="1.6" cx="4.762" cy="3.9" fill="red"></circle>
      <circle r="0.9" cx="1.137" cy="5.6" fill="blue"></circle>
      <circle r="0.9" cx="2.726" cy="1.0" fill="green"></circle>
    </svg>
  );
}

export { GameLogo };
