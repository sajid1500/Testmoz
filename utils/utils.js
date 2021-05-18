const twoDecimal = value => {
  const numOfDecim = value % 1 !== 0 ? value.toString().split(".")[1].length : 0
  return numOfDecim > 2 ? value.toFixed(2) : value
};