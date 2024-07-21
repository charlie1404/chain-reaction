import { COLORS } from './constants';

class Player {
  private id: string;
  private color: number;

  constructor(id: string, number = 0) {
    this.id = id;
    this.color = COLORS[number];
  }

  getColor() {
    return this.color;
  }

  getId() {
    return this.id;
  }
}

export { Player };
