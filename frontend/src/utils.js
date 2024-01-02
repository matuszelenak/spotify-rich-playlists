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
    let item = array[moveIndex];
    let length = array.length;
    let diff = moveIndex - toIndex;

    if (diff > 0) {
        return [
            ...array.slice(0, toIndex),
            item,
            ...array.slice(toIndex, moveIndex),
            ...array.slice(moveIndex + 1, length)
        ];
    } else if (diff < 0) {
        return [
            ...array.slice(0, moveIndex),
            ...array.slice(moveIndex + 1, toIndex + 1),
            item,
            ...array.slice(toIndex + 1, length)
        ];
    }
    return array;
}