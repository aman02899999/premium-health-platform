// Approximate nutrition for common Indian foods per typical home serving.
// Values are rounded averages from standard food-composition tables (IFCT 2017 / USDA);
// home recipes vary, so treat them as estimates for planning, not lab data.

export type Diet = "veg" | "egg" | "nonveg";
export type FoodCategory = "grains" | "dal" | "dairy" | "protein" | "veg" | "fruit" | "snack" | "drink" | "fat";

export type Food = {
  id: string;
  name: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  diet: Diet;
  category: FoodCategory;
};

const f = (id: string, name: string, serving: string, kcal: number, protein: number, carbs: number, fat: number, fibre: number, diet: Diet, category: FoodCategory): Food => ({
  id, name, serving, kcal, protein, carbs, fat, fibre, diet, category,
});

export const FOODS: Food[] = [
  // grains
  f("roti", "Whole-wheat roti", "1 medium (40 g)", 110, 3.5, 22, 1, 3, "veg", "grains"),
  f("ghee-roti", "Roti with ghee", "1 medium", 150, 3.5, 22, 5.5, 3, "veg", "grains"),
  f("paratha-plain", "Plain paratha", "1 medium", 230, 5, 32, 9, 3.5, "veg", "grains"),
  f("aloo-paratha", "Aloo paratha", "1 medium", 290, 6, 42, 11, 4, "veg", "grains"),
  f("white-rice", "White rice (cooked)", "1 katori (150 g)", 195, 4, 43, 0.5, 0.6, "veg", "grains"),
  f("brown-rice", "Brown rice (cooked)", "1 katori (150 g)", 170, 4, 36, 1.4, 2.7, "veg", "grains"),
  f("poha", "Poha", "1 plate (200 g)", 270, 5.5, 44, 8, 2.5, "veg", "grains"),
  f("upma", "Rava upma", "1 plate (200 g)", 250, 6, 38, 8, 2.5, "veg", "grains"),
  f("oats", "Oats (dry)", "40 g", 150, 5, 27, 2.8, 4, "veg", "grains"),
  f("dalia", "Vegetable dalia", "1 bowl (200 g)", 190, 6, 34, 3.5, 5, "veg", "grains"),
  f("idli", "Idli", "2 pieces", 130, 4, 26, 0.6, 1.5, "veg", "grains"),
  f("dosa", "Plain dosa", "1 medium", 170, 4, 28, 5, 1.5, "veg", "grains"),
  f("bread-brown", "Brown bread", "2 slices", 150, 6, 26, 2, 3.5, "veg", "grains"),
  f("ragi-roti", "Ragi roti", "1 medium", 100, 2.5, 20, 1, 3, "veg", "grains"),
  f("bajra-roti", "Bajra roti", "1 medium", 120, 3.5, 22, 2, 3, "veg", "grains"),
  f("besan-chilla", "Besan chilla", "1 medium", 150, 7, 17, 6, 3, "veg", "grains"),
  // dal / legumes
  f("moong-dal", "Moong dal (cooked)", "1 katori (150 g)", 150, 9, 22, 3, 5, "veg", "dal"),
  f("toor-dal", "Toor/arhar dal (cooked)", "1 katori (150 g)", 160, 9, 24, 3, 5, "veg", "dal"),
  f("chana-masala", "Chole / chana masala", "1 katori (150 g)", 220, 10, 30, 7, 8, "veg", "dal"),
  f("rajma", "Rajma curry", "1 katori (150 g)", 200, 9, 28, 6, 7, "veg", "dal"),
  f("sprouts", "Moong sprouts", "1 cup (100 g)", 100, 7, 18, 0.5, 4, "veg", "dal"),
  f("roasted-chana", "Roasted chana", "30 g", 110, 6.5, 18, 1.8, 5, "veg", "dal"),
  f("soya-chunks", "Soya chunks (dry)", "30 g", 105, 16, 10, 0.2, 4, "veg", "dal"),
  f("sambar", "Sambar", "1 katori (150 g)", 120, 5, 17, 4, 4, "veg", "dal"),
  // dairy
  f("milk-toned", "Toned milk", "1 glass (250 ml)", 145, 7.5, 12, 7.5, 0, "veg", "dairy"),
  f("curd", "Curd (dahi)", "1 katori (150 g)", 95, 5, 7, 5, 0, "veg", "dairy"),
  f("hung-curd", "Hung curd / Greek yoghurt", "150 g", 130, 14, 7, 5, 0, "veg", "dairy"),
  f("paneer", "Paneer", "100 g", 265, 18, 4, 20, 0, "veg", "dairy"),
  f("low-fat-paneer", "Low-fat paneer", "100 g", 170, 20, 5, 8, 0, "veg", "dairy"),
  f("paneer-bhurji", "Paneer bhurji", "1 plate (150 g)", 330, 20, 8, 24, 1.5, "veg", "dairy"),
  f("buttermilk", "Chaas (buttermilk)", "1 glass (250 ml)", 45, 2.5, 5, 1.5, 0, "veg", "dairy"),
  f("tofu", "Tofu", "100 g", 145, 15, 3, 8.5, 1, "veg", "dairy"),
  // protein
  f("egg-boiled", "Boiled egg", "1 large", 75, 6.5, 0.5, 5, 0, "egg", "protein"),
  f("egg-whites", "Egg whites", "3 whites", 50, 11, 0.7, 0.2, 0, "egg", "protein"),
  f("omelette", "Masala omelette (2 eggs)", "1 omelette", 190, 13, 3, 14, 0.5, "egg", "protein"),
  f("chicken-breast", "Chicken breast (cooked)", "100 g", 165, 31, 0, 3.6, 0, "nonveg", "protein"),
  f("chicken-curry", "Home-style chicken curry", "1 katori (150 g)", 240, 22, 6, 14, 1, "nonveg", "protein"),
  f("tandoori-chicken", "Tandoori chicken", "2 pieces (150 g)", 260, 34, 4, 12, 0.5, "nonveg", "protein"),
  f("fish-curry", "Fish curry", "1 katori (150 g)", 200, 20, 5, 11, 0.5, "nonveg", "protein"),
  f("grilled-fish", "Grilled fish", "100 g", 130, 24, 0, 3, 0, "nonveg", "protein"),
  f("whey", "Whey protein", "1 scoop (30 g)", 120, 24, 3, 1.5, 0, "veg", "protein"),
  f("peanut-butter", "Peanut butter", "1 tbsp (16 g)", 95, 4, 3, 8, 1, "veg", "fat"),
  // vegetables
  f("mixed-sabzi", "Mixed veg sabzi", "1 katori (150 g)", 120, 3, 12, 7, 4, "veg", "veg"),
  f("palak-paneer", "Palak paneer", "1 katori (150 g)", 220, 11, 8, 16, 3, "veg", "veg"),
  f("bhindi", "Bhindi sabzi", "1 katori (150 g)", 110, 3, 10, 7, 4, "veg", "veg"),
  f("aloo-sabzi", "Aloo sabzi", "1 katori (150 g)", 170, 3, 22, 8, 3, "veg", "veg"),
  f("salad", "Green salad", "1 bowl", 35, 1.5, 7, 0.2, 2.5, "veg", "veg"),
  f("soya-matar", "Soya matar sabzi", "1 katori (150 g)", 180, 14, 15, 7, 5, "veg", "veg"),
  // fruit
  f("banana", "Banana", "1 medium", 105, 1.3, 27, 0.4, 3, "veg", "fruit"),
  f("apple", "Apple", "1 medium", 95, 0.5, 25, 0.3, 4.4, "veg", "fruit"),
  f("papaya", "Papaya", "1 cup (150 g)", 60, 0.7, 15, 0.4, 2.5, "veg", "fruit"),
  f("guava", "Guava", "1 medium", 70, 2.6, 14, 1, 5.4, "veg", "fruit"),
  // snacks / fats
  f("almonds", "Almonds", "10 pieces (14 g)", 80, 3, 3, 7, 1.7, "veg", "fat"),
  f("peanuts", "Roasted peanuts", "30 g", 170, 7.5, 5, 14, 2.5, "veg", "fat"),
  f("makhana", "Roasted makhana", "30 g", 105, 3, 20, 0.5, 2, "veg", "snack"),
  f("samosa", "Samosa", "1 piece", 260, 4, 28, 15, 2, "veg", "snack"),
  f("ghee", "Ghee", "1 tsp (5 g)", 45, 0, 0, 5, 0, "veg", "fat"),
  f("gulab-jamun", "Gulab jamun", "1 piece", 150, 2, 22, 6, 0.3, "veg", "snack"),
  // drinks
  f("chai", "Chai with milk & sugar", "1 cup", 90, 2.5, 12, 3, 0, "veg", "drink"),
  f("coconut-water", "Coconut water", "1 glass (250 ml)", 45, 1.7, 9, 0.5, 2.5, "veg", "drink"),
  f("nimbu-pani", "Nimbu pani (with sugar)", "1 glass", 60, 0, 15, 0, 0, "veg", "drink"),
];

export const foodById = (id: string) => FOODS.find((x) => x.id === id);

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  grains: "Grains & breakfast",
  dal: "Dals & legumes",
  dairy: "Dairy & tofu",
  protein: "Eggs, meat & fish",
  veg: "Sabzi & salads",
  fruit: "Fruit",
  snack: "Snacks & sweets",
  drink: "Drinks",
  fat: "Nuts & fats",
};

export type Portion = { id: string; qty: number };

export function totals(items: Portion[]) {
  return items.reduce(
    (acc, { id, qty }) => {
      const food = foodById(id);
      if (!food) return acc;
      acc.kcal += food.kcal * qty;
      acc.protein += food.protein * qty;
      acc.carbs += food.carbs * qty;
      acc.fat += food.fat * qty;
      acc.fibre += food.fibre * qty;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  );
}
