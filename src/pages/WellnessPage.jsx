
import React from "react";
import WellnessFitness from "../components/WellnessFitness";

export default function WellnessPage({
  readiness,
  check,
  Human,
}) {
  return (
    <WellnessFitness
      page="wellness"
      readiness={readiness}
      check={check}
      Human={Human}
    />
  );
}
