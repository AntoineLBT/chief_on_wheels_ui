import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/apiClient";
import { db } from "@/services/db";
import { sync } from "@/services/sync";
import { OrderStatus } from "@/utils/constant";
import { clearDb } from "@/test/db";

vi.mock("@/services/apiClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("sync", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    await clearDb();
  });

  it("sends the price and cost snapshots of every line", async () => {
    await db.shifts.add({
      pk: "s1",
      restaurant: "r1",
      date: "2026-10-24T10:00:00.000Z",
      ended_at: null,
      vat_rate: 5.5,
      is_synced: false,
    });
    await db.orders.add({
      pk: "o1",
      shift: "s1",
      customer_name: "Jean",
      picking_time: "2026-10-24T12:00:00.000Z",
      status: OrderStatus.todo,
      is_synced: false,
    });
    await db.orderRecipes.add({
      pk: "or1",
      order: "o1",
      recipe: "margherita",
      unit_price: 10,
      unit_cost: 1,
      is_synced: false,
    });
    await db.orderIngredients.add({
      pk: "oi1",
      order_recipe: "or1",
      ingredient: "mozzarella",
      action_type: "ADD",
      extra_price: 1.5,
      extra_cost: 0.5,
      is_synced: false,
    });
    vi.mocked(api.post).mockResolvedValue({ status: 201 });

    await sync();

    const [, payload] = vi.mocked(api.post).mock.calls[0]!;
    expect(payload).toMatchObject({
      vat_rate: 5.5,
      orders: [
        {
          order_recipes: [
            {
              id: "or1",
              unit_price: 10,
              unit_cost: 1,
              order_ingredients: [
                { id: "oi1", extra_price: 1.5, extra_cost: 0.5 },
              ],
            },
          ],
        },
      ],
    });
  });
});
