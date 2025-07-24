export const getRandomItemsFromArray = (quantity: number, arr: any[]): any[] => {
  const indexs: number[] = [];

  if (quantity >= arr?.length) {
    return arr;
  }

  for (let i = 0; i < quantity; i += 1) {
    let randomIndex: number;
    randomIndex = Math.floor(Math.random() * arr.length);
    if (!indexs.includes(randomIndex)) {
      indexs.push(randomIndex);
    } else {
      randomIndex = Math.floor(Math.random() * arr.length);
      if (!indexs.includes(randomIndex)) indexs.push(randomIndex);
    }
  }

  return indexs.map((index) => arr[index]);
};

export default getRandomItemsFromArray;
