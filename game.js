const newGameButt = document.querySelector('.newGame');
const winDisplay = document.querySelector('.winner');
const turnText = document.querySelector('.turn');
const radioButts = document.querySelectorAll('.player-button input')

class ConnectFour{
    constructor(){
        this.boardDisplay = document.querySelector('.board');
        this.rows = 6;
        this.cols = 7;
        this.gameEnd = true;
        this.rTurn = "Red player's \nturn";
        this.yTurn = "Yellow player's \nturn";
        this.colour = 'Red';
        this.player1;
        this.player2;
        this.currPlayer;
        
        this.SetUpBoard();
        newGameButt.onclick = this.newGame.bind(this);
    }

    SetUpBoard(){
        this.boardDisplay.style.setProperty('--grid-rows', this.rows);
        this.boardDisplay.style.setProperty('--grid-cols', this.cols);
        for (let c = 0; c < (this.rows * this.cols); c++) {
            let cell = document.createElement("div");
            let id =  (this.rows*((c % this.cols) + 1) - 1) -(Math.floor(c/this.cols)) + c % this.cols
            cell.id = id;
            cell.onclick = this.CellClicked.bind(this);
            this.boardDisplay.appendChild(cell).className = "cell";
        }
    }

    ChangeCell(cell){
        let changedCell = document.querySelector(`#${CSS.escape(cell)}`);
        changedCell.style.background = this.colour;
    }

    CellClicked(event){
        if (!this.gameEnd && this.currPlayer.constructor.name == 'Human'){
            const selectedCell = event.composedPath()[0];
            const col = Math.floor(selectedCell.id/(this.rows + 1));
            this.currPlayer.MakeMove(BigInt(col));
        }
    }

    SwitchPlayer(){
        if(this.currPlayer == this.player1){
            turnText.innerText = this.yTurn;
            turnText.style.color = '#F6BE00';
            this.currPlayer = this.player2;
            this.colour = 'Yellow'
        }else{
            turnText.innerText = this.rTurn;
            turnText.style.color = 'red';    
            this.currPlayer = this.player1;  
            this.colour = 'Red'        
        }

        if(this.currPlayer.constructor.name == 'Computer'){
            this.currPlayer.MakeMove();
        }
    }

    Winner(win){
        let winPlayer;
        if(win){
            winPlayer = this.colour;
        } else{
            winPlayer = 'Draw. No'
        }
    
        winDisplay.style.display = 'flex'
        document.querySelector('.wintext').innerText = `${winPlayer} player wins`
        this.gameEnd = true;
        turnText.innerText = ' ';

        for (let butt of radioButts){
            butt.disabled = false;
        }
    }

    GetPlayers(){
        this.player1Type = document.querySelector('input[name="rplayer"]:checked').value;
        this.player2Type = document.querySelector('input[name="yplayer"]:checked').value;

        if(this.player1Type == 'human'){
            this.player1  = new Human('Red', this);
        }else{
            this.player1  = new Computer('Red', this);
        }
        if(this.player2Type == 'human'){
            this.player2  = new Human('Yellow', this);
        }else{
            this.player2  = new Computer('Yellow', this);
        }

        this.currPlayer = this.player1;
    }

    newGame(){
        console.clear();
        for(let cell of this.boardDisplay.children){
            cell.style.background = 'white';
        }
        for (let butt of radioButts){
            butt.disabled = true;
        }

        this.gameEnd = false;
        winDisplay.style.display = 'none';
        turnText.innerText = this.rTurn;
        turnText.style.color = 'Red';
        this.colour = 'Red';
        this.GetPlayers();
        
        if(this.currPlayer.constructor.name == 'Computer'){
            this.currPlayer.MakeMove();
        }
    }
}

let conn4 = new ConnectFour();