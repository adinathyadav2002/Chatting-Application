// utils/time.js
export const toIST = (utcDate) => {
  return new Date(
    new Date(utcDate).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );
};
