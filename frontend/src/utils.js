const reconcileTempo = (track, suppliedTempo) => {
    let determined;

    return {
        ...track,
        tempo: {
            determined: 0,
            spotify: track.tempo,
            backend: suppliedTempo
        }
    }
}

export default function move (array, moveIndex, toIndex) {
    /* #move - Moves an array item from one position in an array to another.

       Note: This is a pure function so a new array will be returned, instead
       of altering the array argument.

      Arguments:
      1. array     (String) : Array in which to move an item.         (required)
      2. moveIndex (Object) : The index of the item to move.          (required)
      3. toIndex   (Object) : The index to move item at moveIndex to. (required)
    */
    let item = array[moveIndex];
    let length = array.length;
    let diff = moveIndex - toIndex;

    if (diff > 0) {
        // move left
        return [
            ...array.slice(0, toIndex),
            item,
            ...array.slice(toIndex, moveIndex),
            ...array.slice(moveIndex + 1, length)
        ];
    } else if (diff < 0) {
        // move right
        return [
            ...array.slice(0, moveIndex),
            ...array.slice(moveIndex + 1, toIndex + 1),
            item,
            ...array.slice(toIndex + 1, length)
        ];
    }
    return array;
}