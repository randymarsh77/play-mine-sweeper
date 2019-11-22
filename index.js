#!/usr/bin/env node
'use strict';

require('colors');
require('keypress')(process.stdin);
const readline = require('readline');
const ArgumentParser = require('argparse').ArgumentParser;

process.stdin.setRawMode(true);
process.stdin.resume();
process.on('SIGINT', () => process.exit(0));

const parser = new ArgumentParser({ addHelp:true });
parser.addArgument([ '-s', '--size' ], { help: 'The size of your board.' });
parser.addArgument([ '-m', '--mines' ], { help: 'The number of mines to place.' });
parser.addArgument('--no-emoji-number-space', { action: 'storeTrue', help: 'Terminals are different. This toggles the extra space off after the numbers in case that works better for you.' });
const args = parser.parseArgs();

const userProvidedSize = args.size && parseInt(args.size);
const userProvidedMines = args.mines && parseInt(args.mines);

const boardSize = userProvidedSize ? Math.min(100, Max(1, userProvidedSize)) : 8;
const numberOfMines = userProvidedMines ? Math.min(boardSize * boardSize - 1, Math.max(1, userProvidedMines)) : boardSize;
const coveredSquare = '⬛';
const mine = '💣';
const explodedMine = '🔥'
const flag = `🏳️${args.no_emoji_number_space ? '' : ' '}`;
const numbers = {
	0: `0️⃣${args.no_emoji_number_space ? '' : ' '}`,
	1: `1️⃣${args.no_emoji_number_space ? '' : ' '}`,
	2: `2️⃣${args.no_emoji_number_space ? '' : ' '}`,
	3: `3️⃣${args.no_emoji_number_space ? '' : ' '}`,
	4: `4️⃣${args.no_emoji_number_space ? '' : ' '}`,
	5: `5️⃣${args.no_emoji_number_space ? '' : ' '}`,
	6: `6️⃣${args.no_emoji_number_space ? '' : ' '}`,
	7: `7️⃣${args.no_emoji_number_space ? '' : ' '}`,
	8: `8️⃣${args.no_emoji_number_space ? '' : ' '}`,
};

const indexes = [...Array(boardSize * boardSize).keys()];

const mineLocations = new Set(shuffle(indexes).slice(0, numberOfMines));
const adjacentMineCounts = indexes.map((_, i) => adjacentIndexes(i).reduce((acc, v) => mineLocations.has(v) ? acc + 1 : acc, 0));

const playerBoard = indexes.map(() => coveredSquare);
let playerLocation = 0;
let hasPrintedOnce = false;

const moves = {
	c: k => k.ctrl ? process.exit(0) : {},
	d: k => k.ctrl ? process.exit(0) : {},
	f: () => playerBoard[playerLocation] = playerBoard[playerLocation] !== coveredSquare ? playerBoard[playerLocation] === flag ? coveredSquare : playerBoard[playerLocation] : flag,
	up: () => playerLocation = playerLocation < boardSize ? playerLocation : playerLocation - boardSize,
	down: () => playerLocation = playerLocation > boardSize * boardSize - boardSize ? playerLocation : playerLocation + boardSize,
	left: () => playerLocation = playerLocation > 0 ? playerLocation - 1 : playerLocation,
	right: () => playerLocation = playerLocation === boardSize * boardSize - 1 ? playerLocation : playerLocation + 1,
	return: () => {
		process.stdout.clearLine();
		expose(playerLocation);
	},
};

process.stdin.on('keypress', (_, key) => {
	const func = key && moves[key.name];
	if (func) {
		func(key);
		gameLoop();
	}
});

console.log('\n\nWelcome to MineSweeper!');
console.log('Use the arrow keys to change the selected square.');
console.log('Reveal locations by pressing `return`.');
console.log('Flag (or un-flag) locations by pressing `f`.');
console.log('Have fun!');
console.log(`\n${boardSize}x${boardSize} with ${numberOfMines} mines.`);
gameLoop();

function gameLoop() {
	const playerHasWon = playerBoard.reduce((acc, v, i) => acc && (mineLocations.has(i) || v !== coveredSquare), true);
	if (playerHasWon) {
		exposeAllMines();
		printBoard(playerBoard);
		console.log("🎉🎉🎉 You win! 🎉🎉🎉");
		process.exit(0)
	}

	printBoard(playerBoard);
}

function expose(index) {
	if (playerBoard[index] === flag) {
		gameLoop();
	} else if (mineLocations.has(index)) {
		exposeAllMines();
		playerBoard[index] = explodedMine;
		playerLocation = -1;
		printBoard(playerBoard);
		console.log("😵😵😵 You lose! 😵😵😵");
		process.exit(0)
	} else {
		if (adjacentMineCounts[index] !== 0) {
			playerBoard[index] = numbers[adjacentMineCounts[index]];
		} else {
			exposeAllAdjacentZeros(index);
		}
		gameLoop();
	}
}

function adjacentIndexes(index) {
	const isTop = index < boardSize;
	const isBottom = index >= boardSize * boardSize - boardSize;
	const isLeft = index % boardSize === 0;
	const isRight = index % boardSize === boardSize - 1;

	let adjacent = [];

	if (!isTop) {
		if (!isLeft) { adjacent.push(index - boardSize - 1) }
		adjacent.push(index - boardSize)
		if (!isRight) { adjacent.push(index - boardSize + 1) }
	}

	if (!isLeft) { adjacent.push(index - 1) }
	if (!isRight) { adjacent.push(index + 1) }

	if (!isBottom) {
		if (!isLeft) { adjacent.push(index + boardSize - 1) }
		adjacent.push(index + boardSize)
		if (!isRight) { adjacent.push(index + boardSize + 1) }
	}

	return adjacent;
}

function exposeAllMines() {
	indexes.map((_, i) => {
		if (mineLocations.has(i)) {
			playerBoard[i] = mine;
		}
	});
}

function exposeAllAdjacentZeros(index) {
	if (playerBoard[index] !== coveredSquare || adjacentMineCounts[index] !== 0 || mineLocations.has(index)) {
		return;
	}

	playerBoard[index] = numbers[0];
	adjacentIndexes(index).forEach(x => {
		exposeAllAdjacentZeros(x);
	});
}

function printBoard(board) {
	if (hasPrintedOnce) {
		readline.moveCursor(process.stdout, 0, -(boardSize + 2));
	}
	hasPrintedOnce = true;

	const rendered = board.reduce((acc, v, i) => {
		if (i % boardSize === 0) {
			acc += `\n `;
		}

		acc += `${i === playerLocation ? `${v}`.underline.red : v} `;
		return acc;
	}, '');

	console.log(rendered + '\n');
}

function shuffle(array) {
	var i = 0
	  , j = 0
	  , temp = null
  
	for (i = array.length - 1; i > 0; i -= 1) {
	  j = Math.floor(Math.random() * (i + 1))
	  temp = array[i]
	  array[i] = array[j]
	  array[j] = temp
	}

	return array;
}
