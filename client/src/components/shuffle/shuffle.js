import React from "react";

const shuffle = a => {
  let k,
    t,
    // eslint-disable-next-line
    // j,
    i = a.length,
    rand = Math.random;

  // For each element in the array, swap it with a random
  // element (which might be itself)
  ////  PLACE SOURCE FOR RANDOMIZATION FORMULA HERE and in THANKYOU.md
  while (i--) {
    k = (rand() * (i + 1)) | 0;
    t = a[k];
    a[k] = a[i];
    a[i] = t;
  }
  return a;
};

// function shuffle(a) {
//   let k,
//     t,
//     // eslint-disable-next-line
//     j,
//     i = a.length,
//     rand = Math.random;

//   // For each element in the array, swap it with a random
//   // element (which might be itself)
//   while (i--) {
//     k = (rand() * (i + 1)) | 0;
//     t = a[k];
//     a[k] = a[i];
//     a[i] = t;
//   }
//   return a;
// }

export default shuffle;
