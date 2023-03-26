import Board from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Board.js';


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
