import { Module } from "@medusajs/framework/utils";
import KlaviyoService from "./service";

export const KLAVIYO_MODULE = "klaviyo";

export default Module(KLAVIYO_MODULE, {
  service: KlaviyoService,
});
