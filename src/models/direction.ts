type DirectionSign = 1 | -1;

export class Direction {
  constructor(public readonly sign: DirectionSign) {}

  static next = (): Direction => new Direction(1);
  static prev = (): Direction => new Direction(-1);

  isNext = this.sign === 1;
  isPrev = this.sign === -1;

  reverse = () => new Direction((this.sign * -1) as DirectionSign);
}
