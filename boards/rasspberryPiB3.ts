import Board from '../system/interfaces/Board';


const board: Board = {
  defaultPin: {
    hasPullUp: true,
    hasPullDown: true,
    // TODO: check
    hasOpenDrain: true,
    hasInterruption: true,
    directions: 'both',
  },
  pins: {
    // TODO: add !!!!
  },
};

export default board;
