import React from "react";
import Skeleton from "./Skeleton";

const Title = ({ text1, text2, isLoading }) => {
  if (isLoading) {
    return <Skeleton className="h-8 w-48 mb-2" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {text1} <span className="underline text-primary">{text2}</span>
      </h1>
    </div>
  );
};

export default Title;
