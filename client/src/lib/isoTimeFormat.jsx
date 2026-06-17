const isoTimeFormat = (dateTime) => {
  const localTime = new Date(dateTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return localTime;
};

export default isoTimeFormat;