import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { AxiosError, type AxiosResponse } from "axios";
import api from "@/services/apiClient";
import { db, type Ingredient } from "@/services/db";
import { IngredientInUseError, useIngredientStore } from "@/stores/ingredient";
import { IngredientUnit } from "@/utils/constant";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function ingredient(pk: string, overrides: Partial<Ingredient> = {}) {
  return {
    pk,
    restaurant: "r1",
    name: "Mozzarella",
    unit: IngredientUnit.kg,
    price_per_unit: 12.5,
    has_extra: false,
    extra_price: null,
    extra_quantity: null,
    ...overrides,
  };
}

async function reloadedIngredients(restaurantPk = "r1") {
  setActivePinia(createPinia());
  const store = useIngredientStore();
  await store.loadIngredients(restaurantPk);
  return store.ingredients;
}

describe("useIngredientStore", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    await clearDb();
  });

  it("creates an ingredient on the server and keeps it locally", async () => {
    const created = ingredient("i1");
    vi.mocked(api.post).mockResolvedValue({ data: created });
    const store = useIngredientStore();
    await store.loadIngredients("r1");

    const { pk: _, restaurant: __, ...input } = created;
    await store.create("r1", input);

    expect(api.post).toHaveBeenCalledWith(
      "/restaurants/r1/ingredients/",
      input,
    );
    expect(store.ingredients).toEqual([created]);
    expect(await reloadedIngredients()).toEqual([created]);
  });

  it("updates an ingredient on the server and locally", async () => {
    await db.ingredients.add(ingredient("i1"));
    const updated = ingredient("i1", { price_per_unit: 14 });
    vi.mocked(api.patch).mockResolvedValue({ data: updated });
    const store = useIngredientStore();
    await store.loadIngredients("r1");

    await store.update("i1", { price_per_unit: 14 });

    expect(api.patch).toHaveBeenCalledWith("/restaurants/r1/ingredients/i1/", {
      price_per_unit: 14,
    });
    expect(store.ingredients).toEqual([updated]);
    expect(await reloadedIngredients()).toEqual([updated]);
  });

  it("removes an ingredient on the server and locally", async () => {
    await db.ingredients.bulkAdd([ingredient("i1"), ingredient("i2")]);
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });
    const store = useIngredientStore();
    await store.loadIngredients("r1");

    await store.remove("i1");

    expect(api.delete).toHaveBeenCalledWith("/restaurants/r1/ingredients/i1/");
    expect(store.ingredients.map((i) => i.pk)).toEqual(["i2"]);
    expect((await reloadedIngredients()).map((i) => i.pk)).toEqual(["i2"]);
  });

  it("keeps an ingredient still in use and tells which recipes use it", async () => {
    await db.ingredients.add(ingredient("i1"));
    vi.mocked(api.delete).mockRejectedValue(
      new AxiosError("Conflict", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        data: {
          detail: "Ingredient used in recipes or orders.",
          recipes: [{ pk: "rc1", name: "Calzone" }],
        },
      } as AxiosResponse),
    );
    const store = useIngredientStore();
    await store.loadIngredients("r1");

    const error = await store.remove("i1").catch((e) => e);

    expect(error).toBeInstanceOf(IngredientInUseError);
    expect(error.recipes).toEqual([{ pk: "rc1", name: "Calzone" }]);
    expect(store.ingredients.map((i) => i.pk)).toEqual(["i1"]);
    expect((await reloadedIngredients()).map((i) => i.pk)).toEqual(["i1"]);
  });
});
