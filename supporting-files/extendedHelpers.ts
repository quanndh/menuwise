import { GetUnitsData } from "./data-access";
import { ConvertUnits } from "./helpers";
import { UnitOfMeasure, UoMName, UoMType } from "./models";

//path finding
function ConvertUnitV2(
  fromUoM: UnitOfMeasure,
  toUoMName: UoMName,
  toUoMType: UoMType
): UnitOfMeasure {
  let visited = {};
  let queue: Array<number> = [];
  let conversionFactorQueue: Array<number> = [];
  let conversionFactor = 0;
  let res = -1;

  const units = [
    ...GetUnitsData(),
    ...GetUnitsData().map((unit) => ({
      fromUnitName: unit.toUnitName,
      fromUnitType: unit.toUnitType,
      toUnitName: unit.fromUnitName,
      toUnitType: unit.fromUnitType,
      conversionFactor: 1 / unit.conversionFactor,
    })),
  ];

  //get starting node
  const startingNodeIndex = units.findIndex(
    (unit) =>
      unit.fromUnitName === fromUoM.uomName &&
      unit.fromUnitType === fromUoM.uomType
  );
  if (startingNodeIndex !== -1) {
    queue.push(startingNodeIndex);
    conversionFactorQueue.push(units[startingNodeIndex].conversionFactor);
    visited[startingNodeIndex] = true;
  }

  while (queue.length != 0) {
    let front = queue.shift()!;
    conversionFactor = conversionFactorQueue.shift()!;
    if (
      front !== startingNodeIndex &&
      units[front].toUnitName === toUoMName &&
      units[front].toUnitType === toUoMType
    ) {
      res = front;
      break;
    }

    //find next node
    for (let i = 0; i < units.length; i++) {
      if (
        !visited[i] &&
        units[front].toUnitName === units[i].fromUnitName &&
        units[front].toUnitType === units[i].fromUnitType
      ) {
        visited[i] = true;
        queue.push(i);
        conversionFactorQueue.push(
          conversionFactor * units[i].conversionFactor
        );
      }
    }
  }

  if (res === -1) {
    throw new Error(
      `Couldn't convert ${fromUoM.uomName} to ${toUoMName} (extended)`
    );
  }

  return {
    uomAmount: fromUoM.uomAmount * conversionFactor,
    uomName: toUoMName,
    uomType: toUoMType,
  };
}

export function ConvertUnitsExtended(
  fromUoM: UnitOfMeasure,
  toUoMName: UoMName,
  toUoMType: UoMType
): UnitOfMeasure {
  try {
    const uom = ConvertUnits(fromUoM, toUoMName, toUoMType);
    return uom;
  } catch (error) {
    return ConvertUnitV2(fromUoM, toUoMName, toUoMType);
  }
}

export function SumUnitsOfMeasureExtended(
  uomA: UnitOfMeasure,
  uomB: UnitOfMeasure
): UnitOfMeasure {
  const convertedUomB = ConvertUnitsExtended(uomB, uomA.uomName, uomA.uomType);
  return {
    uomAmount: uomA.uomAmount + convertedUomB.uomAmount,
    uomName: uomA.uomName,
    uomType: uomA.uomType,
  };
}
