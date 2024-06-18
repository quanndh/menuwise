import {
  GetProductsForIngredient,
  GetRecipes,
  NutrientBaseUoM,
} from "./supporting-files/data-access";
import {
  ConvertUnitsExtended,
  SumUnitsOfMeasureExtended,
} from "./supporting-files/extendedHelpers";
import {
  Recipe,
  SupplierProduct,
  UnitOfMeasure,
} from "./supporting-files/models";
import { RunTest, ExpectedRecipeSummary } from "./supporting-files/testing";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
let recipeSummary = {}; // the final result to pass into the test function

/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */

function getSupplierPrice(
  supplierProduct: SupplierProduct,
  toUoM: UnitOfMeasure
): number {
  if (supplierProduct.supplierProductUoM.uomAmount == 0) {
    return 0;
  }

  const { uomName, uomType } = supplierProduct.supplierProductUoM;
  const uom = ConvertUnitsExtended(toUoM, uomName, uomType);
  return (
    (supplierProduct.supplierPrice /
      supplierProduct.supplierProductUoM.uomAmount) *
    uom.uomAmount
  );
}

const getCheapestRecipe = (receipe: Recipe): any => {
  let result = {
    cheapestCost: 0,
    nutrientsAtCheapestCost: {},
  };
  let nutrientsSum = {};

  for (const lineItem of receipe.lineItems) {
    let products = GetProductsForIngredient(lineItem.ingredient);
    if (products.length == 0) {
      continue;
    }

    let cheapestProductCost = Infinity;
    let cheapestProductIndex = -1;

    for (let i = 0; i < products.length; i++) {
      for (let j = 0; j < products[i].supplierProducts.length; j++) {
        const supplierProduct = products[i].supplierProducts[j];
        const price = getSupplierPrice(supplierProduct, lineItem.unitOfMeasure);
        if (price < cheapestProductCost) {
          cheapestProductIndex = i;
          cheapestProductCost = price;
        }
      }
    }

    result.cheapestCost += cheapestProductCost;

    // Calculate nutrients
    for (const fact of products[cheapestProductIndex].nutrientFacts) {
      const nutrientName = fact.nutrientName;

      const convertedNutrient = ConvertUnitsExtended(
        fact.quantityAmount,
        fact.quantityPer.uomName,
        fact.quantityPer.uomType
      );
      if (!nutrientsSum[nutrientName]) {
        nutrientsSum[nutrientName] = convertedNutrient;
      } else {
        nutrientsSum[nutrientName] = SumUnitsOfMeasureExtended(
          nutrientsSum[nutrientName],
          convertedNutrient
        );
      }
    }
  }

  const orderedNutrientsSum = Object.keys(nutrientsSum)
    .sort()
    .reduce((obj, key) => {
      obj[key] = nutrientsSum[key];
      return obj;
    }, {});

  for (const nutrientName in orderedNutrientsSum) {
    result.nutrientsAtCheapestCost[nutrientName] = {
      nutrientName,
      quantityAmount: orderedNutrientsSum[nutrientName],
      quantityPer: NutrientBaseUoM,
    };
  }

  return result;
};

for (const recipe of recipeData) {
  recipeSummary[recipe.recipeName] = getCheapestRecipe(recipe);
}

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);
