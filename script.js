let board_width = 10;
let board_height = 9;
let mines = 15;

// 0: easy 9x8 8 mines
// 1: medium 10x9 15 mines
// 2: hard 14x9 27 mines
// 3: custom
let mode = 0;

let total_tiles = board_height * board_width;
let total_nonmine_tiles = total_tiles - mines;
let game_started = false;

let mine_primary = true;

document.querySelector("#reload").addEventListener("click", reload);

document.querySelector("#easy").addEventListener("click", switchMode);
document.querySelector("#medium").addEventListener("click", switchMode);
document.querySelector("#hard").addEventListener("click", switchMode);

document.querySelector("#mine-board").addEventListener("contextmenu", (e) => {e.preventDefault()});

document.querySelector("#dig").addEventListener("click", switchButtons);
document.querySelector("#flag").addEventListener("click", switchButtons);

document.querySelector("#remaining-mines div").textContent = mines;

function init() {
	console.log(board_width + "x" + board_height + " " + mines + " mines");
	document.querySelector("#mine-board").style["grid-template-columns"] = "repeat(" + board_width +", auto)";
	document.querySelector("#mine-board").style["aspect-ratio"] = board_width + "/" + board_height;

	refreshScore();

	document.querySelector("#remaining-mines div").textContent = mines;
	document.querySelector("#flags div").textContent = 0;
	for (let row = 1; row <= board_height; row++) {
		for (let column = 1; column <= board_width; column++) {
			let tile = document.createElement("div");
			tile.classList.add("tile");
			tile.column = column;
			tile.row = row;
			tile.index = (row * board_width) + column - board_width;
			tile.mine = false;
			tile.num = 0;
			tile.flag = 0;
			document.querySelector("#mine-board").appendChild(tile);
			document.querySelector("#mine-board").style["grid-template-columns"] = "repeat(" + board_width + ", auto)";

			if (mine_primary) {
				tile.addEventListener("click", reveal);
				tile.addEventListener("contextmenu", placeFlag);
			} else {
				tile.addEventListener("click", placeFlag);
				tile.addEventListener("contextmenu", reveal);
			}

			let tile_sym = document.createElement("div");
			tile_sym.classList.add("tile-sym");
			tile.appendChild(tile_sym);

			let tile_overlay = document.createElement("div");
			tile_overlay.classList.add("tile-overlay");
			tile.appendChild(tile_overlay);
		}
	}
}

function refreshScore() {
	if (board_height == 9 && board_width == 8 && mines == 8) {
		mode = 0;
		document.querySelector("#mode").textContent = "EASY";
	} else if (board_height == 9 && board_width == 10 && mines == 15) {
		mode = 1;
		document.querySelector("#mode").textContent = "MEDIUM";
	} else if (board_height == 9 && board_width == 14 && mines == 27) {
		mode = 2;
		document.querySelector("#mode").textContent = "HARD";
	} else {
		mode = 3;
		document.querySelector("#mode").textContent = "CUSTOM";
	}

	document.body.setAttribute("mode", mode);

	if (!localStorage.getItem("score")) {
		localStorage.setItem("score", true);

		localStorage.setItem("score-easy", 0);
		localStorage.setItem("score-medm", 0);
		localStorage.setItem("score-hard", 0);
		localStorage.setItem("score-cust", 0);

		localStorage.setItem("loss-easy", 0);
		localStorage.setItem("loss-medm", 0);
		localStorage.setItem("loss-hard", 0);
		localStorage.setItem("loss-cust", 0);
	} else {
		switch (document.body.getAttribute("mode")) {
			case "0":
				document.querySelector("#win-count").textContent = localStorage.getItem("score-easy");
				document.querySelector("#loss-count").textContent = localStorage.getItem("loss-easy");
				break;
			case "1":
				document.querySelector("#win-count").textContent = localStorage.getItem("score-medm");
				document.querySelector("#loss-count").textContent = localStorage.getItem("loss-medm");
				break;
			case "2":
				document.querySelector("#win-count").textContent = localStorage.getItem("score-hard");
				document.querySelector("#loss-count").textContent = localStorage.getItem("loss-hard");
				break;
			default:
				document.querySelector("#win-count").textContent = localStorage.getItem("score-cust");
				document.querySelector("#loss-count").textContent = localStorage.getItem("loss-cust");
				break;
		}
	}
}

function getTile(index) {
	let tile;
	document.querySelectorAll(".tile").forEach((e) => {
		if (e.index == index) {
			tile = e;
		}
	});
	return tile;
}

function generateMines(tile) {
	for (let i = 1; i <= mines; i++) {
		let mine_loc = Math.floor(Math.random() * total_tiles) + 1;
		if (!getTile(mine_loc).mine && isEmpty(tile, mine_loc)) {
			getTile(mine_loc).mine = true;
		} else {
			i--;
			continue;
		}
	}
	document.querySelectorAll(".tile").forEach((e) => {
		if (e.mine) {
			e.classList.add("mine");
		}
	});
}

function isEmpty(tile, mine_loc) {
	for (let x = tile.column-1; x <= tile.column+1; x++) {
		if (x > board_width || x <= 0) {
			continue;
		}
		for (let y = tile.row-1; y <= tile.row+1; y++) {
			if (y > board_height || y <= 0) {
				continue;
			}

			tile_index = (y * board_width) + x - board_width;
			if (mine_loc == tile_index) {
				return false;
			}
		}
	}
	return true;
}

function calculateSurroundingMines() {
	document.querySelectorAll(".tile").forEach((e) => {
		if (e.mine) {
			return;
		}
		let mine_count = 0;
		for (let x = e.column-1; x <= e.column+1; x++) {
			if (x > board_width || x <= 0) {
				continue;
			}
			for (let y = e.row-1; y <= e.row+1; y++) {
				if (y > board_height || y <= 0) {
					continue;
				}

				tile_index = (y * board_width) + x - board_width;
				if (getTile(tile_index).mine) {
					mine_count++;
				}
			}
		}
		e.children[0].classList.add("n" + mine_count);
		e.children[0].innerHTML = mine_count;
		e.num = mine_count;
		mine_count = 0;
	});
}
function reveal() {
	if (!game_started) {
		startGame(this);
	}
	if (this.flag != 0) {
		return;
	}
	if (this.classList.contains("revealed") && this.num != 0) {
		autoReveal(this.index);
	}
	if (!this.mine) {
		let click = new Audio('./click.wav');
		click.play();
	} else if (this.mine) {
		this.classList.add("revealed");
		this.classList.add("blown-up");
		let rot = Math.round(Math.random() * 40) - 20;
		let x = Math.round(Math.random() * 16) - 8;
		let y = Math.round(Math.random() * 16) - 8;
		this.style.transform = "rotate(" + rot + "deg) scale(0.95) translate(" + x + "px, " + y + "px)";
		let boom = new Audio('./boom.mp3');
		boom.play();
	}
	this.classList.add("revealed");
	if (this.num == 0 && !this.mine) {
		revealSurrounding(this.index);
	}
	checkGameStatus();
}

function autoReveal(index) {
	let tile = getTile(index);
	let surrounding_flags = 0;
	for (let x = tile.column-1; x <= tile.column+1; x++) {
		if (x > board_width || x <= 0) {
			continue;
		}
		for (let y = tile.row-1; y <= tile.row+1; y++) {
			if (y > board_height || y <= 0) {
				continue;
			}

			let tile_index = (y * board_width) + x - board_width;
			let tile = getTile(tile_index);
			if (tile.flag == 1) {
				surrounding_flags++;
			}
		}
	}
	if (surrounding_flags != tile.num) {
		return;
	}
	for (let x = tile.column-1; x <= tile.column+1; x++) {
		if (x > board_width || x <= 0) {
			continue;
		}
		for (let y = tile.row-1; y <= tile.row+1; y++) {
			if (y > board_height || y <= 0) {
				continue;
			}

			let tile_index = (y * board_width) + x - board_width;
			let tile = getTile(tile_index);
			if (!tile.classList.contains("revealed") && tile.flag == 0) {
				tile.classList.add("revealed");
				if (tile.mine) {
					tile.classList.add("revealed");
					tile.classList.add("blown-up");
					let rot = Math.round(Math.random() * 40) - 20;
					let x = Math.round(Math.random() * 16) - 8;
					let y = Math.round(Math.random() * 16) - 8;
					tile.style.transform = "rotate(" + rot + "deg) scale(0.95) translate(" + x + "px, " + y + "px)";
					let boom = new Audio('./boom.mp3');
					boom.play();
					return;
				}
				if (tile.num == 0) {
					revealSurrounding(tile_index);
				}
			}
		}
	}
}

function revealSurrounding(index) {
	let tile = getTile(index);
	new Promise(resolve => setTimeout(resolve, 16)).then(() => {
		for (let x = tile.column-1; x <= tile.column+1; x++) {
			if (x > board_width || x <= 0) {
				continue;
			}
			for (let y = tile.row-1; y <= tile.row+1; y++) {
				if (y > board_height || y <= 0) {
					continue;
				}

				let tile_index = (y * board_width) + x - board_width;
				let tile = getTile(tile_index);
				if (!tile.classList.contains("revealed")) {
					tile.classList.add("revealed");
					if (tile.num == 0) {
						revealSurrounding(tile_index);
					}
				}
			}
		}
	});
}

function checkGameStatus() {
	// 0: default
	// 1: lost
	// 2: won
	let status = 0;
	let revealed = 0;
	let flags = 0;
	document.querySelectorAll(".tile").forEach((e) => {
		if (e.classList.contains("revealed") && e.mine) {
			status = 1;
			return;
		}
		if (e.classList.contains("revealed")) {
			revealed++;
		}
		if (e.flag == 1) {
			flags++; 
		}
	});

	document.querySelector("#remaining-mines div").textContent = mines - flags;
	document.querySelector("#flags div").textContent = flags;

	if (revealed >= total_nonmine_tiles && status != 1) {
		document.querySelector("#game-status").classList.add("finish");
		win();
	} else if (status == 1) {
		document.querySelector("#game-status").classList.add("finish");
		lose();
	}
}

function lose() {

	document.querySelector("#game-status").textContent = "You Lost!";
	document.querySelector("#mine-board").style["pointer-events"] = "none";
	
	switch (document.body.getAttribute("mode")) {
		case "0":
			localStorage.setItem("loss-easy", Number(localStorage.getItem("loss-easy"))+1);
			break;
		case "1":
			localStorage.setItem("loss-medm", Number(localStorage.getItem("loss-medm"))+1);
			break;
		case "2":
			localStorage.setItem("loss-hard", Number(localStorage.getItem("loss-hard"))+1);
			break;
		default:
			localStorage.setItem("loss-cust", Number(localStorage.getItem("loss-cust"))+1);
			break;
	}

	refreshScore();

	document.querySelectorAll(".tile").forEach(async (e) => {
		if (e.mine && !e.classList.contains("blown-up")) {
			new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3330))).then(() => {
				e.classList.add("revealed");
				e.classList.add("blown-up");
				let rot = Math.round(Math.random() * 40) - 20;
				let x = Math.round(Math.random() * 16) - 8;
				let y = Math.round(Math.random() * 16) - 8;
				e.style.transform = "rotate(" + rot + "deg) scale(0.95) translate(" + x + "px, " + y + "px)";
				let boom = new Audio('./boom.mp3');
				boom.play();
			});
		} else if (!e.classList.contains("revealed")) {
			new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000))).then(() => {
				let rot = Math.round(Math.random() * 10) - 5;
				let x = Math.round(Math.random() * 4) - 2;
				let y = Math.round(Math.random() * 4) - 2;
				e.style.transform = "rotate(" + rot + "deg) translate(" + x + "px, " + y + "px)";
			});
		}
	});
	document.querySelector("#mine-board").style["transform"] = "scale(0.975)";
	document.querySelector("#mine-board").style["opacity"] = "0.75";
}

function win() {
	document.querySelector("#game-status").textContent = "You Won!";
	document.querySelector("#mine-board").style["pointer-events"] = "none";

	switch (document.body.getAttribute("mode")) {
		case "0":
			localStorage.setItem("score-easy", Number(localStorage.getItem("score-easy"))+1);
			break;
		case "1":
			localStorage.setItem("score-medm", Number(localStorage.getItem("score-medm"))+1);
			break;
		case "2":
			localStorage.setItem("score-hard", Number(localStorage.getItem("score-hard"))+1);
			break;
		default:
			localStorage.setItem("score-cust", Number(localStorage.getItem("score-cust"))+1);
			break;
	}

	refreshScore();

	document.querySelector("#remaining-mines div").textContent = 0;
	document.querySelector("#flags div").textContent = mines;

	let win = new Audio('./tada.wav');
	win.play();
	
	document.querySelectorAll(".tile").forEach((e) => {
		if (e.mine) {
			e.children[1].setAttribute("overlay", 1);
		}
	});

	let jsConfetti = new JSConfetti();
	
	jsConfetti.addConfetti().then(() => {
		jsConfetti.clearCanvas();
	});
}

function placeFlag() {
	if (this.classList.contains("revealed")) {
		return;
	}
	let flag = new Audio('./flag.wav');
	flag.play();
	switch (this.flag) {
		case 0:
			this.flag = 1;
			break;
		case 1:
			this.flag = 2;
			break;
		case 2:
			this.flag = 0;
			break;
	
		default:
			break;
	}
	this.children[1].setAttribute("overlay", this.flag);
	checkGameStatus();
}

function startGame(tile) {
	game_started = true;
	generateMines(tile);
	calculateSurroundingMines();
}

function switchMode() {
	switch (this.id) {
		case "easy":
			board_height = 9;
			board_width = 8;
			mines = 8;
			break;
	
		case "medium":
			board_height = 9;
			board_width = 10;
			mines = 15;
			break;
			
		case "hard":
			board_height = 9;
			board_width = 14;
			mines = 27;
			break;
			
		default:
			break;
	}
	reload();
}

function reload() {
	let tiles = document.querySelector("#mine-board");
	while (tiles.firstChild) {
		tiles.removeChild(tiles.firstChild);
	}
	
	total_tiles = board_height * board_width;
	total_nonmine_tiles = total_tiles - mines;
	game_started = false;

	document.querySelector("#game-status").classList.remove("finish");
	document.querySelector("#mine-board").setAttribute("style", "");

	let reload = new Audio('./reload.wav');
	reload.play();
	init();
}

function switchButtons() {
	if (this.id == "dig") {
		mine_primary = true;
	} else if (this.id == "flag") {
		mine_primary = false;
	}
	let click = new Audio('./click.wav');
	click.play();
	if (mine_primary) {
		document.querySelector("#selection").setAttribute("primary", "dig");
		document.querySelectorAll(".tile").forEach((e) => {
			e.addEventListener("click", reveal);
			e.addEventListener("contextmenu", placeFlag);
			e.removeEventListener("click", placeFlag);
			e.removeEventListener("contextmenu", reveal);
		});
	} else {
		document.querySelector("#selection").setAttribute("primary", "flag");
		document.querySelectorAll(".tile").forEach((e) => {
			e.removeEventListener("click", reveal);
			e.removeEventListener("contextmenu", placeFlag);
			e.addEventListener("click", placeFlag);
			e.addEventListener("contextmenu", reveal);
		});
	}
}
init();