import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ProfileCreateQueryResourceObjectAttributes } from "klaviyo-api";
import { KLAVIYO_MODULE } from "../../modules/klaviyo";
import { IKlaviyoService } from "../../types/klaviyo";

const addProfileStep = createStep(
  "add-profile",
  async (attributes: ProfileCreateQueryResourceObjectAttributes, context) => {
    const klaviyoService =
      context.container.resolve<IKlaviyoService>(KLAVIYO_MODULE);

    const profile = await klaviyoService.createProfile(attributes);

    return new StepResponse(
      `Profile created: ${profile.data.id}`,
      profile.data.id
    );
  }
);

export default addProfileStep;
