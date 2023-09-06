class GridElement {
	constructor() {
		this.count = 0;
		this.isCritical = false;
		this.owner = null;
	}

	increment() {
		this.count++;
	}

	claim(player) {
		this.owner = player;
	}

	isOwnedBy(player) {
		return this.owner === player;
	}
}

class GameState {
	constructor() {
		this.grid = [];
		this.turn = 0;
		this.winner = null;
		this.gameOver = false;
	}
}

export { GridElement, GameState };
