# MinerTS

A remake of the classic MinerVGA using TypeScript and the [babylon.js](https://www.babylonjs.com/) 3D engine.

![babylon.js](https://github.com/christopherstock/MinerTS/raw/master/_ASSET/readme/logo_babylon-js.png)

## Tech Stack
- babylon.js 4.0.3
- TypeScript 3.4.5
- Webpack 4.40
- Jest 24.9
- TypeDoc 0.14
- ESLint 6.8
- TSLint 5.16

<hr>

## Play online!

You can play a hosted version of this project here:

https://christopherstock.github.io/MinerTS/dist/

Use the following keys:

| Key   | Function           |
| ------|:------------------:|
| UP    | Move Up            |
| DOWN  | Move Down          |
| LEFT  | Move Left          |
| RIGHT | Move Right         |
| ENTER | Toggle camera zoom |

<hr>

## MinerVGA 1989

![MinerVGA 1989](https://github.com/christopherstock/MinerTS/raw/master/_ASSET/readme/screenshot_old.jpg)

Miner is a game of rare earths mining. In the game, you assume the role of a miner in search of rare earths like silver,
 gold, and platinum. The goal is to collect enough cash to marry Mimi and retire.

### Play the classic game online!

https://www.playdosgames.com/play/miner-vga/

<hr>

## Installation

Clone the project repository via Git and execute the following command in the local project directory: 

`npm install`

## Development

Run the Webpack Dev Server for building and executing the Application:

`npm run webpack:devserver`

The application can now be seen in the browser using the following address:
 
`http://localhost:1236/`

The following frontend shall appear now:

![Frontend](https://github.com/christopherstock/MinerTS/raw/master/_ASSET/readme/screenshot_new.jpg)

All project code changes result in an immediate rebuild of the project by the Webpack Dev Server.
 The app is automatically reloaded in the browser after the build process has been finished.
