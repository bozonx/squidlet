export type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';


// export function promiseState(promise: Promise<any>, callback: (status: PromiseStatus) => void) {
//   // Symbols and RegExps are never content-equal
//   //const uniqueValue = window['Symbol'] ? Symbol('unique') : /unique/;
//   //const uniqueValue = /unique/;
//   const uniqueValue = Symbol('unique');
//
//   function notifyPendingOrResolved(value: any) {
//     console.log(1111111, value)
//     if (value === uniqueValue) {
//       return callback('pending');
//     } else {
//       return callback('fulfilled');
//     }
//   }
//
//   function notifyRejected(reason: any) {
//     return callback('rejected');
//   }
//
//   const race = [promise, Promise.resolve(uniqueValue)];
//
//   Promise.race(race).then(notifyPendingOrResolved, notifyRejected);
// }

// /**
//  * This function allow you to modify a JS Promise by adding some status properties.
//  * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
//  * But modified according to the specs of promises : https://promisesaplus.com/
//  */
// export function MakeQuerablePromise(promise: any) {
//   // Don't modify any promise that has been already modified.
//   if (promise.isFulfilled) return promise;
//
//   // Set initial state
//   let isPending = true;
//   let isRejected = false;
//   let isFulfilled = false;
//
//   // Observe the promise, saving the fulfillment in a closure scope.
//   const result = promise.then(
//     function(v: any) {
//       isFulfilled = true;
//       isPending = false;
//
//       return v;
//     },
//     function(e: any) {
//       isRejected = true;
//       isPending = false;
//
//       throw e;
//     }
//   );
//
//   result.isFulfilled = () => isFulfilled;
//   result.isPending = () => isPending;
//   result.isRejected = () => isRejected;
//
//   return result;
// }
