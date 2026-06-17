import React from "react";

const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      className={`animate-pulse bg-zinc-800/80 rounded-md ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
