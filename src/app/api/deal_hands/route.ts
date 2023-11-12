import { NextRequest, NextResponse } from 'next/server';

const JSONdb = require('simple-json-db');
const DB = new JSONdb('./storage.json');

// @ts-ignore
import Client from 'mina-signer';
const client = new Client({ network: 'testnet' });

(BigInt.prototype as any).toJSON = function() {
    return this.toString();
  };


function createDeck(){
    const cardFaces: string[] = [];
    const ranks = 'Ace,2,3,4,5,6,7,8,9,10,Jack,Queen,King'.split(',');
    const suites = 'Spades,Hearts,Diamonds,Clubs'.split(',');
    for (let rank of ranks) {
        for (let suite of suites) {
        const cardFace = `${rank} of ${suite}`;
        cardFaces.push(cardFace);
        }
    }
    return cardFaces;
}

// Fisher Yates Shuffle
function shuffle(array:bigint[]): bigint[] {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }


 function createArray(n: number): bigint[] {
    const arr = Array(n).fill(null).map((_, i) => BigInt(i+1));
    return arr
 }

function getHandData(handId: string, gameId: string){
    console.log("gameId", DB.get(gameId));

    let shuffledDeck:bigint[]

    if (DB.get(gameId)==undefined){
        shuffledDeck = shuffle(createArray(52))
        console.log("initiating deck", shuffledDeck);
    } else {
        console.log("deck found")
         let data: string[] = JSON.parse(DB.get(gameId))
         shuffledDeck = data.map(str => BigInt(str));
        console.log("deck for gameId", shuffledDeck)
    }

    console.log("deck length", shuffledDeck.length)
    
    let i = 1 // number of cards to be drawn
    if (handId == "hole"){
        i = 2
    }
    if (handId =="flop"){
        i = 3
    }

    const cardsToReturn = shuffledDeck.slice(0, i)
    const remainingDeck = shuffledDeck.slice(i)

    console.log("cards given", cardsToReturn);
    console.log("remainingDeck", remainingDeck);

    DB.set(gameId, JSON.stringify(remainingDeck))


    const privateKey = "EKFLHx273j3WU9rJg6ndchQgoZ4Hk1cp35bhrZYM8ivrjb3LmNYM"
    const signature = client.signFields(
        cardsToReturn,
        privateKey
    );
    
  return {
    "hand": cardsToReturn, 
    "signature":  signature.signature, 
    "publicKey":  signature.publicKey
  }

}

export function GET(request: NextRequest) {
    const searchParams = new URLSearchParams(request.nextUrl.search);
    const gameId = searchParams.get("gameId") ?? "1"
    const handId = searchParams.get("handId") ?? "take"
    const data = getHandData(handId, gameId);

  return new Response(JSON.stringify(
    data
  ))
}