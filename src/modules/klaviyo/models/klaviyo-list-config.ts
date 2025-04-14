import { model } from "@medusajs/framework/utils";

const KlaviyoListConfig = model.define("klaviyo_list_config", {
  id: model.id().primaryKey(),
  source: model.enum(["purchasers", "subscribers"]),
  destination_list_id: model.text(),
});

export default KlaviyoListConfig;
