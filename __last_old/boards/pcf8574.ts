import Board from '../system/interfaces/Board';


const board: Board = {
  defaultPin: {
    hasPullUp: true,
    hasPullDown: false,
    // TODO: check
    hasOpenDrain: true,
    hasInterruption: false,
    directions: 'both',
  },
};

export default board;
