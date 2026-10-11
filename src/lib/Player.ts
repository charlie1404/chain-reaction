import { COLORS } from './constants';

class Player {
  private id: string;
  private index: number;
  private color: number;

  constructor(id: string, index = 0, colorIndex?: number) {
    this.id = id;
    this.index = index;
    const resolvedColorIdx = colorIndex !== undefined && colorIndex >= 0 ? colorIndex : index;
    this.color = COLORS[resolvedColorIdx % COLORS.length];
  }

  getColor() {
    return this.color;
  }

  getId() {
    return this.id;
  }

  getIndex() {
    return this.index;
  }
}

export { Player };
