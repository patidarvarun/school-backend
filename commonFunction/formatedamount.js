//calculate and format price function
const formatePrice = (price) => {
  const formattedNumber = price?.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formattedNumber;
};
module.exports = formatePrice;
