class Player{
    constructor(colour, game){
        this.game = game;
        this.playerColour = colour;
        this.maxDepth;
        this.rows = 6n;
        this.cols = 7n;

        Player.totalBoard = 0n;
        Player.playerBoard = 0n;
        Player.movesLeft = this.rows*this.cols;
    }

    static totalBoard;
    static playerBoard;
    static movesLeft;

    AvailableMoves(position){
        let moves = []
        for(let i = 0n; i < this.cols; i++){
            if(this.IsValidMove(i, position)){
                moves.push(i);
            }
        }
        return moves;
    }

    TurnEnd(){
        Player.movesLeft--;
        let winner = this.CheckWin(Player.playerBoard, Player.totalBoard);
        Player.playerBoard ^= Player.totalBoard;

        if(winner){
            this.game.Winner(winner);
        } else if(winner == null){
            this.game.Winner(winner);
        } else{
            this.game.SwitchPlayer();
        }
    }

    IsValidMove(col, position){
        return !((1n << ((this.rows+1n) * (col+1n) - 2n)) & position);
    }

    CheckWin(playerBoard, totalBoard){
        //horizontal
        let h = playerBoard & (playerBoard >> (this.rows+1n));
        if(h & (h >> ((this.rows+1n))*2n)) return true;

        // vertical
        let v = playerBoard & (playerBoard >> 1n);
        if(v & (v >> 2n)) return true;

        // // diagonal ascending
        let da = playerBoard & (playerBoard >> (this.rows+2n));
        if(da & (da >> ((this.rows+2n))*2n)) return true;

        // // diagonal descending
        let dd = playerBoard & (playerBoard >> (this.rows));
        if(dd & (dd >> ((this.rows))*2n)) return true;

        //draw
        if(this.AvailableMoves(totalBoard).length == 0) return null;
     
        //no win or draw
        return false
    }

    GetCell(col){
        let c = Player.totalBoard >> ((this.rows + 1n) * col);
        c = ((c + 1n) & ~c) << ((this.rows + 1n) * col);
        return Math.log2(Number(c));
    }

    PlacePiece(col, playerBoard, totalBoard){
        let boardBefore = totalBoard;
        totalBoard |= totalBoard + (1n << ((this.rows+1n)*col));
        playerBoard +=  totalBoard ^ boardBefore;
        return [playerBoard, totalBoard];
    }
}

class Human extends Player{
    constructor(playerColour, game){
        super(playerColour, game);
    }

    MakeMove(col){
        if(this.IsValidMove(col, Player.totalBoard)){
            let cell = this.GetCell(col);
            let newBoards = this.PlacePiece(col, Player.playerBoard, Player.totalBoard);
            Player.playerBoard = newBoards[0];
            Player.totalBoard = newBoards[1];

            this.game.ChangeCell(cell);
            this.TurnEnd();
            
        }
    }
}

class Computer extends Player{
    constructor(playerColour, game){
        super(playerColour, game);
        this.gamesExplored;
        this.top = 0n;
        this.board_mask = 0n;
        this.basicMoveOrder = [];

        this.GetBitmaps();  
        this.GetBasicMoveOrder(); 
    }

    AvailableMoves(position){
        let moves = []
        this.basicMoveOrder.forEach(col => { 
            if(this.IsValidMove(col, position)) moves.push(col);
        });
        return moves;
    }

    GetBasicMoveOrder(){
        let centerLeft;
        let centerRight
        if(this.cols % 2n == 0n){//even
            centerRight = this.rows/2n;
            centerLeft = centerRight - 1n;
            this.basicMoveOrder.push(centerLeft, centerRight);
        }else{ //odd
            centerRight = centerLeft = BigInt(Math.floor(Number(this.cols/2n)));
            this.basicMoveOrder.push(centerRight);
        }

        for(let i = 1n; i < centerLeft + 1n; i++){
            this.basicMoveOrder.push(centerLeft - i, centerRight + i);
        }
    }

    HammingWeight(bit){
        //good algorithim when number of set bits are small(true in this case)
        let count = 0;
        for(; bit; count++) bit &= bit - 1n;
        return count;
    }

    GetBetterMoveOrder(playerBoard, totalBoard, unorderedMoves){
        let moves = [];
        let scores = [];
        function AddMove(col, moveScore){
            let index = moves.length;
            for(; index && scores[index - 1] < moveScore; --index){
                scores[index] = scores[index -1];
                moves[index] = moves[index -1];
            }
            scores[index] = moveScore;
            moves[index] = col;
        }

        let orderedMoves = this.basicMoveOrder.filter(col => unorderedMoves.includes(col));
   
        if(orderedMoves.length > (this.cols/2n + 1n)){ //heurestic that needs tweeking
            orderedMoves.forEach(col =>{
                let newBoards = this.PlacePiece(col, playerBoard, totalBoard);
                let score = this.HammingWeight(this.WinningPositions(newBoards[0], newBoards[1]));
                AddMove(col, score);
            });
        }else{
            return orderedMoves
        } 

        return moves;
    }

    GetBitmaps(){
        for(let i=0; i < this.cols; i++){ //top rows
            this.top = (this.top << (this.rows+1n)) + 1n;
        }

        for(let i=0; i<this.cols; i++){ //playable squares
            this.board_mask <<= this.rows + 1n;
            this.board_mask += 2n**this.rows - 1n;
        }
    }

    WinningPositions(playerBoard, totalBoard){
        // vertical
        let conn3 = (playerBoard << 1n) & (playerBoard << 2n) & (playerBoard << 3n);

        //horizontal
        let horiz2 = (playerBoard << (this.rows + 1n)) & (playerBoard << (2n*(this.rows + 1n)));
        conn3 |= horiz2 & (playerBoard << (3n*(this.rows + 1n)));
        conn3 |= horiz2 & (playerBoard >> (this.rows+1n));
        horiz2 >>= 3n*(this.rows +1n);
        conn3 |= horiz2 & (playerBoard >> (3n*(this.rows + 1n)));
        conn3 |= horiz2 & (playerBoard << (this.rows+1n));

        //diaganol acsending
        let diagAscend2 = (playerBoard << (this.rows + 2n)) & (playerBoard << (2n*(this.rows + 2n)));
        conn3 |= diagAscend2 & (playerBoard << (3n*(this.rows + 2n)));
        conn3 |= diagAscend2 & (playerBoard >> (this.rows + 2n));
        diagAscend2 >>= 3n*(this.rows + 2n);
        conn3 |= diagAscend2 & (playerBoard >> (3n*(this.rows + 2n)));
        conn3 |= diagAscend2 & (playerBoard << (this.rows + 2n));

        //diaganol descend
        let diagDescend2 = (playerBoard << (this.rows)) & (playerBoard << (2n*(this.rows)));
        conn3 |= diagDescend2 & (playerBoard << (3n*(this.rows)));
        conn3 |= diagDescend2 & (playerBoard >> (this.rows));
        diagDescend2 >>= 3n*(this.rows);
        conn3 |= diagDescend2 & (playerBoard >> (3n*(this.rows)));
        conn3 |= diagDescend2 & (playerBoard << (this.rows));

        let unplayedCells = (totalBoard ^ this.board_mask)
        return (conn3 & unplayedCells);
    }

    Connect3Positions(playerBoard, totalBoard){
        // vertical
        let conn3 = (playerBoard << 1n) & (playerBoard << 2n);

        //horizontal
        let horiz1 = (playerBoard << (this.rows + 1n));
        conn3 |= horiz1 & (playerBoard << (2n*(this.rows + 1n)));
        conn3 |= horiz1 & (playerBoard >> (this.rows+1n));
        horiz1 >>= 2n*(this.rows +1n);
        conn3 |= horiz1 & (playerBoard >> (2n*(this.rows + 1n)));
        conn3 |= horiz1 & (playerBoard << (this.rows+1n));

        // diaganol acsending
        let diagAscend1 = (playerBoard << (this.rows + 2n));
        conn3 |= diagAscend1 & (playerBoard << (2n*(this.rows + 2n)));
        conn3 |= diagAscend1 & (playerBoard >> (this.rows + 2n));
        diagAscend1 >>= 2n*(this.rows + 2n);
        conn3 |= diagAscend1 & (playerBoard >> (2n*(this.rows + 2n)));
        conn3 |= diagAscend1 & (playerBoard << (this.rows + 2n));

        //diaganol descend
        let diagDescend1 = (playerBoard << (this.rows));
        conn3 |= diagDescend1 & (playerBoard << (2n*(this.rows)));
        conn3 |= diagDescend1 & (playerBoard >> (this.rows));
        diagDescend1 >>= 2n*(this.rows);
        conn3 |= diagDescend1 & (playerBoard >> (2n*(this.rows)));
        conn3 |= diagDescend1 & (playerBoard << (this.rows));

        let unplayedCells = (totalBoard ^ this.board_mask)//dont add top row as 1's
        return (conn3 & unplayedCells);
    }

    NonLosingMoves(playerBoard, totalBoard){
        let possibleMoves = (totalBoard + this.top) & this.board_mask;
        let opponentConn3 = this.WinningPositions(playerBoard ^ totalBoard, totalBoard);
        let forcedMoves = opponentConn3 & possibleMoves;
        
        if(forcedMoves){
            if(forcedMoves & (forcedMoves - 1n)) return []; //2+ forced wins, so no good response
            else possibleMoves = forcedMoves
        }
        possibleMoves &= ~(opponentConn3 >> 1n); //dont play underneath losing moves

        let nonLosingMoves = [];
        while(possibleMoves){
            let move = possibleMoves & (~possibleMoves + 1n);
            let col = BigInt(Math.floor(Math.log2(Number(move))/Number((this.rows + 1n))));
            nonLosingMoves.push(col);
            possibleMoves &= possibleMoves - 1n;
        }

        return this.basicMoveOrder.filter(col => nonLosingMoves.includes(col));
        // return this.GetBetterMoveOrder(playerBoard, totalBoard, nonLosingMoves)
    }

    HeuresticEvaluation(playerBoard, totalBoard){
        let opponentBoard = playerBoard ^ totalBoard;
        let playerConn3 = this.HammingWeight(this.WinningPositions(playerBoard, totalBoard));
        let playerConn2 = this.HammingWeight(this.Connect3Positions(playerBoard, totalBoard));
        let opponnetConn3 = this.HammingWeight(this.WinningPositions(opponentBoard, totalBoard));
        let opponentConn2 = this.HammingWeight(this.Connect3Positions(opponentBoard, totalBoard));

        let playerScore = playerConn3*2 + playerConn2;
        let opponentScore = opponnetConn3*2 + opponentConn2;
        return playerScore - opponentScore;
    }

    SavePosition(key, move, alphaOrig, beta){
        Player.seenPositions[key] = {};
        Player.seenPositions[key].move = move;
        if(move.score <= alphaOrig){
            Player.seenPositions[key].flag = 'upperbound';
        }else if(move.score <= beta){
            Player.seenPositions[key].flag = 'lowerbound';
        }else{
            Player.seenPositions[key].flag = 'exact';
        }
    }

    MakeMove(){
        this.gamesExplored = 0;
        Player.seenPositions = {};
        if(Player.movesLeft >= 36){
            this.maxDepth = 8;
        }else if(Player.movesLeft >= 26){
            this.maxDepth = 12;
        }else{
            this.maxDepth = 26;
        }
        
        let move;
        if(Player.movesLeft == this.rows*this.cols){
            move = {'col': 3n, 'score': 0}
        }else{
            let startTime = performance.now();
            move = this.HeuresticMiniMax(Player.playerBoard, Player.totalBoard, -Infinity, Infinity, this.maxDepth);
            let endTime = performance.now()
            console.log(endTime - startTime + 'ms')
        }

        let col = move.col;
        console.log('Games explored: ' + this.gamesExplored)
        console.log(this.playerColour + ' score: ' + move.score);
        console.log('')
        
        let cell = this.GetCell(col);

        let newBoards = this.PlacePiece(col, Player.playerBoard, Player.totalBoard);
        Player.playerBoard = newBoards[0];
        Player.totalBoard = newBoards[1];

        setTimeout(() => {
            this.game.ChangeCell(cell);
            this.TurnEnd();
        }, 500);
    }

    HeuresticMiniMax(playerBoard, totalBoard, alpha, beta, depth){
        let key = this.top + totalBoard + playerBoard;
        let ttEntry = Player.seenPositions[key];
        let nonLosingMoves = this.NonLosingMoves(playerBoard, totalBoard); 
        let movesLeft = Number(this.rows*this.cols) - this.HammingWeight(totalBoard);
        let alphaOrig = alpha;
        let best = {};
        best.score = -Math.ceil((movesLeft-1)/2)*100;
        this.gamesExplored++;

        if(ttEntry!= undefined){//check transposition table
            if(ttEntry.flag == 'exact'){
                return ttEntry.move;
            }else if(ttEntry.flag = 'lowerbound'){
                alpha = Math.max(alpha, ttEntry.move.score);
            }else if(ttEntry.flag == 'upperbound'){
                beta = Math.min(beta, ttEntry.move.score)
            }

            if(alpha >= beta){
                return ttEntry.move
            }
        }

        if(movesLeft == Player.movesLeft){ //if win
            let winningMoves = this.WinningPositions(playerBoard, totalBoard) & (totalBoard + this.top);
            if(winningMoves){
                let move = winningMoves & (~winningMoves + 1n); //finds first winning position as there might be multiple
                let col = BigInt(Math.floor(Math.log2(Number(move))/Number((this.rows + 1n))));
                best.score = Math.ceil((movesLeft)/2) * 100;
                best.col = col;
                return best;
            }
        }

        if(movesLeft == 1){ //if draw
            best.col = this.AvailableMoves(totalBoard)[0];
            best.score = 0;
            return best
        }

        if(depth == 0){//if at maxDepth
            best.score = this.HeuresticEvaluation(playerBoard, totalBoard);
            return best;
        }

        for(let i = 0; i < nonLosingMoves.length; i++){ // calcs minimax for non-losing moves
            let col = nonLosingMoves[i];
            let newBoards = this.PlacePiece(col, playerBoard, totalBoard);
            let move = this.HeuresticMiniMax(newBoards[0] ^ newBoards[1], newBoards[1], -beta, -alpha, depth - 1);
            let currVal = -move.score

            if(currVal > best.score){
                best.score = currVal;
                best.col = col;
            }
            alpha = Math.max(best.score, alpha);
            if (beta <= alpha) break;
        };

        //if comp loses this turn, pick random column as it will never be assigned
        if(depth == this.maxDepth && best.col == undefined){
            best.col = this.AvailableMoves(totalBoard)[0]
        }

        this.SavePosition(key, best, alphaOrig, beta);
        return best;
    }

    PerfectMiniMax(playerBoard, totalBoard, alpha, beta){
        let key = this.top + totalBoard + playerBoard;
        let ttEntry = Player.seenPositions[key];
        let nonLosingMoves = this.NonLosingMoves(playerBoard, totalBoard); 
        let movesLeft = Number(this.rows*this.cols) - this.HammingWeight(totalBoard);
        let alphaOrig = alpha;
        let best = {};
        best.score = -Math.ceil((movesLeft-1)/2);
        this.gamesExplored++;

        if(ttEntry!= undefined){//check transposition table
            if(ttEntry.flag == 'exact'){
                return ttEntry.move;
            }else if(ttEntry.flag = 'lowerbound'){
                alpha = Math.max(alpha, ttEntry.move.score);
            }else if(ttEntry.flag == 'upperbound'){
                beta = Math.min(beta, ttEntry.move.score)
            }

            if(alpha >= beta){
                return ttEntry.move
            }
        }

        if(movesLeft == Player.movesLeft){ //if win
            let winningMoves = this.WinningPositions(playerBoard, totalBoard) & (totalBoard + this.top);
            if(winningMoves){
                let move = winningMoves & (~winningMoves + 1n); //finds first winning position as there might be multiple
                let col = BigInt(Math.floor(Math.log2(Number(move))/Number((this.rows + 1n))));
                best.score = Math.ceil((movesLeft)/2);;
                best.col = col;
                return best;
            }
        }

        if(movesLeft == 1){ //if draw
            best.col = this.AvailableMoves(totalBoard)[0];
            best.score = 0;
            return best
        }

        for(let i = 0; i < nonLosingMoves.length; i++){ // calcs minimax for non-losing moves
            let col = nonLosingMoves[i];
            let newBoards = this.PlacePiece(col, playerBoard, totalBoard);
            let move = this.GoodMiniMax(newBoards[0] ^ newBoards[1], newBoards[1], -beta, -alpha);
            let currVal = -move.score

            if(currVal > best.score){
                best.score = currVal;
                best.col = col;
            }
            alpha = Math.max(best.score, alpha);
            if (beta <= alpha) break;
        };

        this.SavePosition(key, best, alphaOrig, beta);
        return best;
    }
}