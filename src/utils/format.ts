export const formatMoney = (amount: number | string) => {
    const num = Number(amount) || 0;
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
