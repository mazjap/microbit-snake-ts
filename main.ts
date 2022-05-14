const gridSize = 5

enum Dir {
    NORTH,
    EAST,
    SOUTH,
    WEST
}

function oppositeDirection(direction: Dir): Dir {
    switch (direction) {
    case Dir.NORTH:
        return Dir.SOUTH
    case Dir.EAST:
        return Dir.WEST
    case Dir.SOUTH:
        return Dir.NORTH
    case Dir.WEST:
        return Dir.EAST
    }
}

function changeDirection(direction: Dir, left: boolean): Dir {
    switch (snake.direction) {
        case Dir.NORTH:
            return left ? Dir.WEST : Dir.EAST
        case Dir.EAST:
            return left ? Dir.NORTH : Dir.SOUTH
        case Dir.SOUTH:
            return left ? Dir.EAST : Dir.WEST
        case Dir.WEST:
            return left ? Dir.SOUTH : Dir.NORTH
    }
}

class Coordinate {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = (x >= 0 && x < gridSize)
            ? Math.floor(x)
            : -1
        this.y = (y >= 0 && y < gridSize)
            ? Math.floor(y)
            : -1
    }

    isValid(): boolean {
        return (
            this.x >= 0 && this.x < gridSize &&
            this.y >= 0 && this.y < gridSize
        )
    }

    static center: Coordinate = new Coordinate(gridSize / 2, gridSize / 2)

    static random(): Coordinate {
        return new Coordinate(Math.randomRange(0, gridSize - 1), Math.randomRange(0, gridSize - 1))
    }
}

function nextCoordinateFor(direction: Dir, coordinate: Coordinate): Coordinate {
    let newX = coordinate.x
    let newY = coordinate.y

    switch (direction) {
        case Dir.NORTH:
            newY -= 1
            break
        case Dir.EAST:
            newX += 1
            break
        case Dir.SOUTH:
            newY += 1
            break
        case Dir.WEST:
            newX -= 1
            break
    }

    return new Coordinate(newX, newY)
}

class Snake {
    body: Coordinate[]
    direction: Dir

    constructor(direction: Dir) {
        const oppositeDir = oppositeDirection(direction)
        const head = nextCoordinateFor(oppositeDir, Coordinate.center)

        this.body = [head, nextCoordinateFor(oppositeDir, head)]
        this.direction = direction
    }

    head(): Coordinate {
        const head = this.body[0]
        return new Coordinate(head.x, head.y)
    }

    tail(): Coordinate {
        const tail = this.body[this.body.length - 1]
        return new Coordinate(tail.x, tail.y)
    }

    advance(shouldRemoveTail: boolean): Coordinate | void {
        this.body.insertAt(0, nextCoordinateFor(this.direction, this.head()))

        if (shouldRemoveTail) {
            return this.body.pop()
        }
    }

    bodyContains(coordinate: Coordinate): boolean {
        if (this.body.find(({ x, y }) => coordinate.x === x && coordinate.y === y)) {
            return true
        } else {
            return false
        }
    }
}

let snake: Snake = new Snake(Dir.NORTH)
let apple: Coordinate = newApple()
let isGameStarted: boolean = false
let isStarting: boolean = false

function newApple(): Coordinate {
    const lastApple = apple
    let coordinate = Coordinate.random()

    while (snake.bodyContains(coordinate) || (lastApple && coordinate.x == lastApple.x && coordinate.y == lastApple.y)) {
        coordinate = Coordinate.random()
    }

    return coordinate
}

basic.forever(function() {
    if (isStarting) return

    let shouldKillWithFire: boolean = false

    const head = snake.head()
    const tail = snake.tail()

    if (!isGameStarted) {
        const dirs: { [key: string]: Dir | Coordinate | number }[] = [snake.direction]
            .concat(
                [true, false]
                    .map(bool => changeDirection(snake.direction, bool))
            )
            .map(dir => {
                const nextCoord = nextCoordinateFor(dir, head)
                const dx = Math.abs(nextCoord.x - apple.x) + Math.abs(nextCoord.y - apple.y)

                return {
                    dir,
                    nextCoord,
                    dx
                }
            })

        snake.direction = dirs.reduce((current, next, index) => {
            return (current.nextCoord as Coordinate).isValid()
                ? (next.dx < current.dx && (next.nextCoord as Coordinate).isValid() && !snake.bodyContains(next.nextCoord as Coordinate)) ? next : current
                : next
        }, dirs[0]).dir as Dir
    }

    let nextCoordinate = nextCoordinateFor(snake.direction, head)

    snake.body.forEach((bodyPart) => {
        if (bodyPart.x === tail.x && bodyPart.y === tail.y) return
        if (bodyPart.x === nextCoordinate.x && bodyPart.y === nextCoordinate.y) {
            shouldKillWithFire = true
        }
    })

    if (!nextCoordinate.isValid()) shouldKillWithFire = true

    basic.clearScreen()
    
    if (shouldKillWithFire) {
        const wasGameStarted = isGameStarted
        isGameStarted = false
        if (wasGameStarted) basic.showString(((snake.body.length === (gridSize * gridSize)) ? "YouWin! " : "") + "Score:" + snake.body.length)
        snake = new Snake(Dir.NORTH)
        apple = newApple()
        return
    }

    if (nextCoordinate.x == apple.x && nextCoordinate.y == apple.y) {
        apple = newApple()
        snake.advance(false)
    } else {
        snake.advance(true)
    }

    snake.body.forEach((bodyPart) => {
        led.plot(bodyPart.x, bodyPart.y)
    })

    led.plotBrightness(apple.x, apple.y, 25)

    basic.pause(isGameStarted ? 300 : 125)
})

input.onButtonPressed(Button.A, () => {
    snake.direction = changeDirection(snake.direction, true)
})

input.onButtonPressed(Button.B, () => {
    snake.direction = changeDirection(snake.direction, false)
})

input.onButtonPressed(Button.AB, () => {
    if (isGameStarted) return

    isStarting = true
    
    led.stopAnimation()

    snake = new Snake(Dir.NORTH)
    apple = newApple()

    basic.showString("321Go")
    isGameStarted = true
    isStarting = false
})
