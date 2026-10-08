/** Whole rupees in Indian grouping. Plain module so server and client components can both call it. */
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
