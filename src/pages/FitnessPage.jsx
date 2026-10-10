import React from "react";
import WellnessFitness from "../components/WellnessFitness";

export default function FitnessPage({
  readiness,
  check,
  Human,
}) {
  return (
    <WellnessFitness
      page="fitness"
      readiness={readiness}
      check={check}
      Human={Human}
    />
  );
}
